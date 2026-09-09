#!/bin/sh
# Publish all ai-testing-tool-js workspace packages to npm in dependency order.
#
# Usage:
#   npm run release            # publish anything not yet on the registry
#   DRY_RUN=true npm run release
#
# Behavior:
#   - @qanalyzer/forge-commons goes first; every other package depends only on it.
#   - Idempotent: versions already on the registry are skipped, so a failed
#     pipeline can be retried without erroring on the packages that made it.
#   - If RELEASE_TAG is set (e.g. v1.0.0 from CI_COMMIT_TAG), every package
#     version must match the tag or the script aborts before publishing.
#   - Each publish runs the package's prepublishOnly hook (build + tests).
#   - Rate limits (HTTP 429) are retried with exponential backoff; a short
#     pause is inserted between publishes to stay under npm's burst limit.
set -eu
cd "$(dirname "$0")/.."

# Load NPM_TOKEN (and anything else) from .env for local publishing.
# In CI, NPM_TOKEN comes from pipeline variables instead.
if [ -f .env ]; then
  set -a
  . ./.env
  set +a
fi

DRY_RUN="${DRY_RUN:-false}"
RELEASE_TAG="${RELEASE_TAG:-}"
# Seconds to wait between successful publishes (avoids burst 429s).
PUBLISH_DELAY_SEC="${PUBLISH_DELAY_SEC:-5}"
# Max attempts per package on 429 / transient network errors.
PUBLISH_RETRIES="${PUBLISH_RETRIES:-5}"

# Workspace directory names; the published (scoped) name is read from each package.json.
PACKAGES="
qa-javascript-commons
qa-cucumberjs
qa-cypress
qa-forge-api-client
qa-jest
qa-mocha
qa-playwright
qa-vitest
qa-wdio
"

if [ -n "$RELEASE_TAG" ]; then
  expected="${RELEASE_TAG#v}"
  for pkg in $PACKAGES; do
    version="$(node -p "require('./$pkg/package.json').version")"
    if [ "$version" != "$expected" ]; then
      echo "ERROR: $pkg is at $version but tag $RELEASE_TAG expects $expected" >&2
      exit 1
    fi
  done
  echo "All package versions match tag $RELEASE_TAG"
fi

# Publish one package with retries on 429 / transient failures.
# Returns 0 on success, non-zero on hard failure after exhausting retries.
publish_with_retry() {
  pkg="$1"
  name="$2"
  version="$3"
  attempt=1
  delay=30
  while [ "$attempt" -le "$PUBLISH_RETRIES" ]; do
    echo "publish: $name@$version (attempt $attempt/$PUBLISH_RETRIES)"
    # Capture both streams so we can detect 429 without losing npm's output.
    if out="$(npm publish --workspace "./$pkg" --access public 2>&1)"; then
      printf '%s\n' "$out"
      return 0
    fi
    status=$?
    printf '%s\n' "$out" >&2
    case "$out" in
      *E429*|*Too\ Many\ Requests*|*rate\ limited*)
        if [ "$attempt" -ge "$PUBLISH_RETRIES" ]; then
          echo "ERROR: rate-limited publishing $name@$version after $PUBLISH_RETRIES attempts" >&2
          return "$status"
        fi
        echo "rate-limited; waiting ${delay}s before retry..." >&2
        sleep "$delay"
        delay=$((delay * 2))
        attempt=$((attempt + 1))
        ;;
      *)
        echo "ERROR: publish failed for $name@$version (non-retryable)" >&2
        return "$status"
        ;;
    esac
  done
  return 1
}

published_any=false
for pkg in $PACKAGES; do
  name="$(node -p "require('./$pkg/package.json').name")"
  version="$(node -p "require('./$pkg/package.json').version")"
  if npm view "$name@$version" version >/dev/null 2>&1; then
    echo "skip: $name@$version is already published"
    continue
  fi
  if [ "$DRY_RUN" = "true" ]; then
    echo "dry-run: would publish $name@$version"
    npm publish --workspace "./$pkg" --access public --dry-run
  else
    # Space out publishes so a fresh burst doesn't trip npm's rate limit.
    if [ "$published_any" = "true" ] && [ "$PUBLISH_DELAY_SEC" -gt 0 ]; then
      echo "waiting ${PUBLISH_DELAY_SEC}s before next publish..."
      sleep "$PUBLISH_DELAY_SEC"
    fi
    publish_with_retry "$pkg" "$name" "$version"
    published_any=true
  fi
done

echo "Done."
