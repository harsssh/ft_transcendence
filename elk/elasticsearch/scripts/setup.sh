#!/usr/bin/env bash
set -euo pipefail

if [ "x${ELASTIC_PASSWORD:-}" = "x" ]; then
  echo "Set the ELASTIC_PASSWORD environment variable in the .env file" >&2
  exit 1
fi

if [ "x${KIBANA_PASSWORD:-}" = "x" ]; then
  echo "Set the KIBANA_PASSWORD environment variable in the .env file" >&2
  exit 1
fi

CERTS_DIR="config/certs"
CA_CRT="${CERTS_DIR}/ca/ca.crt"

if [ ! -f "${CERTS_DIR}/ca.zip" ]; then
  echo "Creating CA"
  bin/elasticsearch-certutil ca --silent --pem -out "${CERTS_DIR}/ca.zip"
  unzip "${CERTS_DIR}/ca.zip" -d "${CERTS_DIR}"
fi

if [ ! -f "${CERTS_DIR}/certs.zip" ]; then
  echo "Creating certs"
  cat > "${CERTS_DIR}/instances.yml" <<'YAML'
instances:
  - name: es01
    dns:
      - es01
      - localhost
    ip:
      - 127.0.0.1
YAML
  bin/elasticsearch-certutil cert --silent --pem \
    -out "${CERTS_DIR}/certs.zip" \
    --in "${CERTS_DIR}/instances.yml" \
    --ca-cert "${CERTS_DIR}/ca/ca.crt" \
    --ca-key "${CERTS_DIR}/ca/ca.key"
  unzip "${CERTS_DIR}/certs.zip" -d "${CERTS_DIR}"
fi

echo "Setting file permissions"
chown -R root:root "${CERTS_DIR}"
find "${CERTS_DIR}" -type d -exec chmod 750 {} \;
find "${CERTS_DIR}" -type f -exec chmod 640 {} \;
find "${CERTS_DIR}" -type f -name "*.crt" -exec chmod 644 {} \;

if [ ! -f "${CA_CRT}" ]; then
  echo "CA cert not found at ${CA_CRT}" >&2
  exit 1
fi

ES_URL="https://es01:9200"

echo "Waiting for Elasticsearch availability"
until curl -s --cacert "${CA_CRT}" "${ES_URL}" | grep -q "missing authentication credentials"; do
  sleep 30
done

echo "Setting kibana_system password"
until curl -s -X POST --cacert "${CA_CRT}" -u "elastic:${ELASTIC_PASSWORD}" \
  -H "Content-Type: application/json" \
  "${ES_URL}/_security/user/kibana_system/_password" \
  -d "{\"password\":\"${KIBANA_PASSWORD}\"}" | grep -q "^{}"; do
  sleep 10
done

# --- Custom bootstrap: ILM policy + index template for proxy access logs ---

echo "Creating/updating ILM policy: proxy-access-logs-policy"
# PUT is idempotent; safe to run on every compose up
curl -fsS -X PUT --cacert "${CA_CRT}" -u "elastic:${ELASTIC_PASSWORD}" \
  -H "Content-Type: application/json" \
  "${ES_URL}/_ilm/policy/proxy-access-logs-policy" \
  -d @- <<'JSON'
{
  "policy": {
    "phases": {
      "hot": {
        "actions": {
          "rollover": {
            "max_age": "1d",
            "max_primary_shard_size": "50gb"
          },
          "set_priority": {
            "priority": 100
          }
        },
        "min_age": "0ms"
      },
      "warm": {
        "min_age": "2d",
        "actions": {
          "set_priority": {
            "priority": 50
          },
          "shrink": {
            "number_of_shards": 1,
            "allow_write_after_shrink": true
          },
          "forcemerge": {
            "max_num_segments": 1
          }
        }
      },
      "delete": {
        "min_age": "30d",
        "actions": {
          "delete": {
            "delete_searchable_snapshot": true
          }
        }
      }
    }
  }
}
JSON

echo "Creating/updating index template: proxy_access_logs_template"
curl -fsS -X PUT --cacert "${CA_CRT}" -u "elastic:${ELASTIC_PASSWORD}" \
  -H "Content-Type: application/json" \
  "${ES_URL}/_index_template/proxy-access-logs-template" \
  -d @- <<'JSON'
{
  "index_patterns": ["proxy-access-logs-*"],
  "template": {
    "settings": {
      "index.lifecycle.name": "proxy-access-logs-policy",
      "index.lifecycle.rollover_alias": "proxy-access-logs"
    }
  }
}
JSON

echo "All done!"
