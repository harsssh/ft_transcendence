#!/bin/sh
set -eu

KIBANA_URL="${KIBANA_PROTOCOL:-https}://${KIBANA_HOST:?KIBANA_HOST is required}"
AUTH="elastic:${ELASTIC_PASSWORD}"

echo "Waiting for Kibana..."
until curl -s -I "${KIBANA_URL}" | grep -q "HTTP/1.1 302"; do
  sleep 5
done

echo "Creating Kibana data views (idempotent)..."

create_data_view() {
  title="$1"
  time_field="${2:-}"

  if [ -n "$time_field" ]; then
    payload=$(cat <<EOF
{"data_view":{"title":"${title}","timeFieldName":"${time_field}"}}
EOF
)
  else
    payload=$(cat <<EOF
{"data_view":{"title":"${title}"}}
EOF
)
  fi

  code=$(curl -sS -u "${AUTH}" \
    -H "kbn-xsrf: true" \
    -H "Content-Type: application/json" \
    -o /tmp/resp.json \
    -w "%{http_code}" \
    -X POST "${KIBANA_URL}/api/data_views/data_view" \
    -d "$payload" || true)

  # Kibana may respond with 400 Duplicate data view instead of 409.
  if [ "$code" = "200" ] || [ "$code" = "201" ] || [ "$code" = "409" ]; then
    echo "- ok: ${title} (http ${code})"
    return 0
  fi

  if [ "$code" = "400" ] && grep -q "Duplicate data view" /tmp/resp.json; then
    echo "- ok: ${title} (already exists)"
    return 0
  fi

  echo "Failed to create data view: ${title} (http ${code})"
  cat /tmp/resp.json || true
  return 1
}

create_data_view "db-users"
create_data_view "db-channels"
create_data_view "db-user_channels"
create_data_view "db-messages" "created_at"
create_data_view "db-friendships" "created_at"
create_data_view "db-guilds" "created_at"
create_data_view "db-guild_members" "joined_at"
create_data_view "proxy-access-logs*" "time"

echo "Done."
