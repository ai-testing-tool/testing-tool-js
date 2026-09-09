#!/bin/sh
# Upload per-package ai-testing-tool-results.json files produced by Vitest (npm test).
#
# Usage:
#   . scripts/load-ingest-env.sh   # optional when qanalyzer-app/.env is present
#   sh scripts/upload-package-reports.sh
#   sh scripts/upload-package-reports.sh qa-jest qa-vitest   # subset
#
# Env: AI_TESTING_TOOL_INGEST_URL, AI_TESTING_TOOL_INGEST_TOKEN, AI_TESTING_TOOL_PROJECT_KEY (or JIRA_PROJECT_KEY)
set -eu
cd "$(dirname "$0")/.."

. scripts/load-ingest-env.sh

PROJECT_KEY="${AI_TESTING_TOOL_PROJECT_KEY:-${JIRA_PROJECT_KEY:-AUTH}}"
LAUNCH_PREFIX="${AI_TESTING_TOOL_LAUNCH_PREFIX:-gitlab sdk}"
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
  report="$pkg/ai-testing-tool-results.json"
  if [ ! -f "$report" ]; then
    echo "skip $pkg — no $report (run npm test first)" >&2
    continue
  fi
  name=$(basename "$pkg")
  echo "upload $report → $PROJECT_KEY (${name})"
  npx @ai-testing-tool/forge-api-client \
    --project "$PROJECT_KEY" \
    --launch "${LAUNCH_PREFIX} ${name} #${PIPELINE_ID}" \
    --report "$report"
done
