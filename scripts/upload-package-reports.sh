#!/bin/sh
# Upload per-package qanalyzer-results.json files produced by Vitest (npm test).
#
# Usage:
#   . scripts/load-ingest-env.sh   # optional when qanalyzer-app/.env is present
#   sh scripts/upload-package-reports.sh
#   sh scripts/upload-package-reports.sh qa-jest qa-vitest   # subset
#
# Env: QANALYZER_INGEST_URL, QANALYZER_INGEST_TOKEN, JIRA_PROJECT_KEY (default AUTH)
set -eu
cd "$(dirname "$0")/.."

. scripts/load-ingest-env.sh

PROJECT_KEY="${JIRA_PROJECT_KEY:-AUTH}"
LAUNCH_PREFIX="${QANALYZER_LAUNCH_PREFIX:-gitlab sdk}"
PIPELINE_ID="${CI_PIPELINE_ID:-local}"

DEFAULT_PACKAGES="
qa-javascript-commons
qa-forge-api-client
qa-cucumberjs
qa-cypress
qa-jest
qa-mocha
qa-playwright
qa-vitest
qa-wdio
examples/single/vitest
"

if [ "$#" -gt 0 ]; then
  PACKAGES="$*"
else
  PACKAGES="$DEFAULT_PACKAGES"
fi

for pkg in $PACKAGES; do
  report="$pkg/qanalyzer-results.json"
  if [ ! -f "$report" ]; then
    echo "skip $pkg — no $report (run npm test first)" >&2
    continue
  fi
  name=$(basename "$pkg")
  echo "upload $report → $PROJECT_KEY (${name})"
  npx @qanalyzer/forge-api-client \
    --project "$PROJECT_KEY" \
    --launch "${LAUNCH_PREFIX} ${name} #${PIPELINE_ID}" \
    --report "$report"
done
