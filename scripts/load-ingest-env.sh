#!/bin/sh
# Load AI Testing Tool ingest credentials when not already set.
#
# Search order (first match wins per variable):
#   1. Existing environment (CI variables, export in shell)
#   2. $AI_TESTING_TOOL_ENV_FILE when set
#   3. ./.env in the repo root
#
# Expected keys: AI_TESTING_TOOL_INGEST_URL, AI_TESTING_TOOL_INGEST_TOKEN
# Optional: JIRA_PROJECT_KEY (legacy), AI_TESTING_TOOL_PROJECT_KEY
set -eu

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

merge_env_file() {
  file="$1"
  [ -f "$file" ] || return 0

  while IFS= read -r line || [ -n "$line" ]; do
    case "$line" in
      ''|\#*) continue ;;
    esac

    key="${line%%=*}"
    val="${line#*=}"

    # Strip optional surrounding quotes.
    case "$val" in
      \"*) val="${val#\"}"; val="${val%\"}" ;;
      \'*) val="${val#\'}"; val="${val%\'}" ;;
    esac

    eval "current=\${$key:-}"
    [ -n "$current" ] && continue
    export "$key=$val"
  done < "$file"
}

if [ -n "${AI_TESTING_TOOL_ENV_FILE:-}" ]; then
  merge_env_file "$AI_TESTING_TOOL_ENV_FILE"
fi

merge_env_file "$ROOT/.env"
