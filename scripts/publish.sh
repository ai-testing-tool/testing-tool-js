#!/bin/sh
# Publish all qanalyzer-js workspace packages to npm in dependency order.
#
# Usage:
#   npm run release            # publish anything not yet on the registry
#   DRY_RUN=true npm run release
#
# Behavior:
#   - qa-forge-commons goes first; every other package depends only on it.
#   - Idempotent: versions already on the registry are skipped, so a failed
#     pipeline can be retried without erroring on the packages that made it.
#   - If RELEASE_TAG is set (e.g. v1.0.0 from CI_COMMIT_TAG), every package
#     version must match the tag or the script aborts before publishing.
#   - Each publish runs the package's prepublishOnly hook (build + tests).
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
    echo "publish: $name@$version"
    npm publish --workspace "./$pkg" --access public
  fi
done

echo "Done."
