#!/usr/bin/env sh
# Upload a report through the ingest-gateway (auto-provision + optional chunking).
#
# Usage:
#   . scripts/load-ingest-env.sh
#   GATEWAY_URL=http://localhost:8080 sh scripts/upload-via-gateway.sh [report.json]
#
set -eu
cd "$(dirname "$0")/.."

. scripts/load-ingest-env.sh

GATEWAY_URL="${GATEWAY_URL:-http://localhost:8080}"
REPORT="${1:-examples/single/vitest/qanalyzer-results.json}"
PROJECT_KEY="${JIRA_PROJECT_KEY:-AUTH}"

if [ -z "${QANALYZER_INGEST_TOKEN:-}" ]; then
  echo "error: QANALYZER_INGEST_TOKEN required" >&2
  exit 1
fi

if [ -z "${QANALYZER_FORGE_INGEST_URL:-}" ]; then
  if [ -z "${QANALYZER_INGEST_URL:-}" ]; then
    echo "error: set QANALYZER_FORGE_INGEST_URL or QANALYZER_INGEST_URL" >&2
    exit 1
  fi
  export QANALYZER_FORGE_INGEST_URL="$QANALYZER_INGEST_URL"
fi
export QANALYZER_INGEST_URL="${GATEWAY_URL}/api/qanalyzer/ingest"

echo "gateway: $QANALYZER_INGEST_URL"
echo "forge:   $QANALYZER_FORGE_INGEST_URL"
echo "report:  $REPORT"

npx @qanalyzer/forge-api-client \
  --project "$PROJECT_KEY" \
  --launch "gateway upload #${CI_PIPELINE_ID:-local}" \
  --report "$REPORT"
