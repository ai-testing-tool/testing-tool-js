#!/bin/sh
# Publish all qanalyzer-js workspace packages to npm in dependency order.
#
# Usage:
#   npm run release            # publish anything not yet on the registry
#   DRY_RUN=true npm run release
#
# Behavior:
#   - qa-javascript-commons goes first; every other package depends only on it.
#   - Idempotent: versions already on the registry are skipped, so a failed
#     pipeline can be retried without erroring on the packages that made it.
#   - If RELEASE_TAG is set (e.g. v1.0.0 from CI_COMMIT_TAG), every package
#     version must match the tag or the script aborts before publishing.
#   - Each publish runs the package's prepublishOnly hook (build + tests).
set -eu
cd "$(dirname "$0")/.."

DRY_RUN="${DRY_RUN:-false}"
RELEASE_TAG="${RELEASE_TAG:-}"

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
  version="$(node -p "require('./$pkg/package.json').version")"
  if npm view "$pkg@$version" version >/dev/null 2>&1; then
    echo "skip: $pkg@$version is already published"
    continue
  fi
  if [ "$DRY_RUN" = "true" ]; then
    echo "dry-run: would publish $pkg@$version"
    npm publish --workspace "$pkg" --dry-run
  else
    echo "publish: $pkg@$version"
    npm publish --workspace "$pkg"
  fi
done

echo "Done."
