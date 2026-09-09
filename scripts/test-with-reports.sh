#!/bin/sh
# Run Vitest per workspace project; @ai-testing-tool/forge-vitest writes ai-testing-tool-results.json.
set -eu
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CONFIG="$ROOT/examples/single/vitest/vitest.config.ts"
cd "$ROOT"

npm run build

project_root() {
  case "$1" in
    pilot) echo "examples/single/vitest" ;;
    *) echo "$1" ;;
  esac
}

issue_prefix() {
  case "$1" in
    pilot) echo "AUTH-1" ;;
    qa-javascript-commons) echo "AUTH-2" ;;
    qa-forge-api-client) echo "AUTH-3" ;;
    qa-cucumberjs) echo "AUTH-4" ;;
    qa-cypress) echo "AUTH-5" ;;
    qa-jest) echo "AUTH-6" ;;
    qa-mocha) echo "AUTH-7" ;;
    qa-playwright) echo "AUTH-8" ;;
    qa-vitest) echo "AUTH-9" ;;
    qa-wdio) echo "AUTH-10" ;;
    *) echo "AUTH-9" ;;
  esac
}

for project in pilot qa-javascript-commons qa-forge-api-client qa-cucumberjs qa-cypress qa-jest qa-mocha qa-playwright qa-vitest qa-wdio; do
  root="$(project_root "$project")"
  echo "==> $project"
  AI_TESTING_TOOL_FILE_PATH="$ROOT/$root/ai-testing-tool-results.json" \
  AI_TESTING_TOOL_LAUNCH_NAME="sdk $project" \
  QA_ISSUE_PREFIX="$(issue_prefix "$project")" \
  npx vitest run --config "$CONFIG" --project "$project"
done
