#!/bin/sh
# import-dashboards.sh
# Imports Kibana dashboards from NDJSON file.
# Uses Kibana Saved Objects Import API (v9).
#
# Before overwriting existing dashboards, current state is backed up
# to a temporary directory.
#
# Usage:
#   KIBANA_URL=http://kibana:5601 \
#   ELASTIC_PASSWORD=changeme \
#   ./import-dashboards.sh [input_file]
#
# If input_file is not specified, defaults to dashboards/dashboards.ndjson
# next to this script.

# Import environment variables from .env

if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

set -eu

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
KIBANA_URL="${KIBANA_PROTOCOL:-https}://${KIBANA_HOST:?KIBANA_HOST is required}"
AUTH="elastic:${ELASTIC_PASSWORD:?ELASTIC_PASSWORD is required}"
INPUT_FILE="${1:-${SCRIPT_DIR}/../dashboards/dashboards.ndjson}"

echo "=== Kibana Dashboard Import ==="
echo "Kibana URL: ${KIBANA_URL}"
echo "Input file: ${INPUT_FILE}"

# Check if input file exists
if [ ! -f "${INPUT_FILE}" ]; then
  echo "No dashboard file found at ${INPUT_FILE}. Skipping import."
  exit 0
fi

# Wait for Kibana to be ready
echo "Waiting for Kibana..."
until curl -skI "${KIBANA_URL}" 2>/dev/null | grep -q "HTTP/1.1"; do
  sleep 2
done
echo "Kibana is ready."

# Backup existing dashboards before overwriting
BACKUP_DIR=$(mktemp -d)
echo "Backing up existing dashboards to ${BACKUP_DIR}..."

backup_file="${BACKUP_DIR}/dashboards-backup.ndjson"
backup_code=$(curl -sSk -u "${AUTH}" \
  -H "kbn-xsrf: true" \
  -H "Content-Type: application/json" \
  -o "${backup_file}" \
  -w "%{http_code}" \
  -X POST "${KIBANA_URL}/api/saved_objects/_export" \
  -d '{
    "type": ["dashboard"],
    "includeReferencesDeep": true
  }' || echo "000")

if [ "$backup_code" = "200" ]; then
  backup_count=$(wc -l < "${backup_file}" | tr -d ' ')
  if [ "$backup_count" -gt 0 ]; then
    echo "Backed up ${backup_count} objects to ${backup_file}"
  else
    echo "No existing dashboards to backup."
  fi
else
  echo "Warning: Could not backup existing dashboards (HTTP ${backup_code}). Continuing anyway..."
fi

# Import dashboards with overwrite option
echo "Importing dashboards..."

response_file=$(mktemp)
http_code=$(curl -sSk -u "${AUTH}" \
  -H "kbn-xsrf: true" \
  -o "${response_file}" \
  -w "%{http_code}" \
  -X POST "${KIBANA_URL}/api/saved_objects/_import?overwrite=true" \
  --form "file=@${INPUT_FILE}")

if [ "$http_code" != "200" ]; then
  echo "Error: Import failed with HTTP ${http_code}"
  cat "${response_file}"
  rm -f "${response_file}"
  echo ""
  echo "Backup is available at: ${backup_file}"
  exit 1
fi

# Parse response
success=$(cat "${response_file}" | grep -o '"success":[^,]*' | cut -d':' -f2 | tr -d ' ')
success_count=$(cat "${response_file}" | grep -o '"successCount":[0-9]*' | cut -d':' -f2)

if [ "$success" = "true" ]; then
  echo "Successfully imported ${success_count} objects."
  # Clean up backup on success
  rm -rf "${BACKUP_DIR}"
else
  echo "Import completed with errors. Check response for details."
  cat "${response_file}"
  echo ""
  echo "Backup is available at: ${backup_file}"
fi

rm -f "${response_file}"
echo "=== Import complete ==="
