#!/bin/sh
# Load QAnalyzer ingest credentials when not already set.
#
# Search order (first match wins per variable):
#   1. Existing environment (GitLab CI/CD variables, export in shell)
#   2. $QANALYZER_ENV_FILE when set
#   3. ../qanalyzer-app/.env (monorepo sibling — same file as the Forge app)
#   4. ./.env in the qanalyzer-js root
#
# Expected keys: QANALYZER_INGEST_URL, QANALYZER_INGEST_TOKEN
# Optional: JIRA_PROJECT_KEY (legacy), QANALYZER_PROJECT_KEY
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

if [ -n "${QANALYZER_ENV_FILE:-}" ]; then
  merge_env_file "$QANALYZER_ENV_FILE"
fi

merge_env_file "$ROOT/../qanalyzer-app/.env"
merge_env_file "$ROOT/.env"
