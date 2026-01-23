#!/bin/sh
# export-dashboards.sh
# Exports all Kibana dashboards to NDJSON format for git versioning.
# Uses Kibana Saved Objects Export API (v9).
#
# Usage:
#   KIBANA_URL=http://localhost:5601 \
#   ELASTIC_PASSWORD=changeme \
#   ./export-dashboards.sh [output_dir]
#
# If output_dir is not specified, defaults to the dashboards/ directory
# next to this script.

# Import environment variables from .env
if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

set -eu

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
KIBANA_URL="https://${KIBANA_HOST:?KIBANA_HOST is required}"
AUTH="elastic:${ELASTIC_PASSWORD:?ELASTIC_PASSWORD is required}"
OUTPUT_DIR="${1:-${SCRIPT_DIR}/../dashboards}"

echo "=== Kibana Dashboard Export ==="
echo "Kibana URL: ${KIBANA_URL}"
echo "Output dir: ${OUTPUT_DIR}"

# Wait for Kibana to be ready
echo "Waiting for Kibana..."
until curl -skI "${KIBANA_URL}" | grep -q "HTTP/1.1"; do
  sleep 2
done
echo "Kibana is ready."

# Ensure output directory exists
mkdir -p "${OUTPUT_DIR}"

# Export all dashboards with their dependencies (includeReferencesDeep)
echo "Exporting dashboards..."

response_file=$(mktemp)
http_code=$(curl -sSk -u "${AUTH}" \
  -H "kbn-xsrf: true" \
  -H "Content-Type: application/json" \
  -o "${response_file}" \
  -w "%{http_code}" \
  -X POST "${KIBANA_URL}/api/saved_objects/_export" \
  -d '{
    "type": ["dashboard"],
    "includeReferencesDeep": true
  }')

if [ "$http_code" != "200" ]; then
  echo "Error: Export failed with HTTP ${http_code}"
  cat "${response_file}"
  rm -f "${response_file}"
  exit 1
fi

# Move exported file to output directory
output_file="${OUTPUT_DIR}/dashboards.ndjson"
mv "${response_file}" "${output_file}"

# Count exported objects
line_count=$(wc -l < "${output_file}" | tr -d ' ')
echo "Exported ${line_count} objects to ${output_file}"

echo "=== Export complete ==="
