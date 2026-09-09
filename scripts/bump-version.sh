#!/bin/sh
# Bump every ai-testing-tool-js workspace to the given release version and keep
# doc version references in sync (step 2 of the Git flow in README.md).
#
# Usage:
#   npm run release:bump 1.2.0
#   sh scripts/bump-version.sh v1.2.0   # leading "v" is stripped
#
# What it does:
#   - npm version <version> for every workspace (lockstep) + npm install
#     (updates package-lock.json). Safe to re-run with the same version.
#   - README.md: rewrites the release-walkthrough examples in the
#     "Releasing" / "Git flow" section (bump, commit, tag, RELEASE_TAG) and
#     the hotfix example tag (next patch).
#   - qa-*/README.md: rewrites pinned install versions (@ai-testing-tool/forge-<pkg>@x.y.z),
#     e.g. in qa-cypress/README.md.
set -eu
cd "$(dirname "$0")/.."

VERSION="${1:?usage: bump-version.sh <version>}"
VERSION="${VERSION#v}"

case "$VERSION" in
  *[!0-9.]*|*..*|.*|*.) echo "ERROR: '$VERSION' is not a plain x.y.z version" >&2; exit 1 ;;
esac

npm version "$VERSION" --workspaces --no-git-tag-version --allow-same-version
npm install

node - "$VERSION" <<'EOF'
const fs = require('fs');
const version = process.argv[2];
const [major, minor, patch] = version.split('.').map(Number);
const nextPatch = `${major}.${minor}.${patch + 1}`;
const SEMVER = '\\d+\\.\\d+\\.\\d+';

function rewrite(file, rules) {
  const before = fs.readFileSync(file, 'utf8');
  let after = before;
  for (const [pattern, replacement] of rules) {
    after = after.replace(pattern, replacement);
  }
  if (after !== before) {
    fs.writeFileSync(file, after);
    console.log(`updated: ${file}`);
  }
}

// Root README — "Releasing" / "Git flow" examples.
rewrite('README.md', [
  [new RegExp(`npm run release:bump ${SEMVER}`, 'g'), `npm run release:bump ${version}`],
  [new RegExp(`npm version ${SEMVER} --workspaces`, 'g'), `npm version ${version} --workspaces`],
  [new RegExp(`release: v${SEMVER}`, 'g'), `release: v${version}`],
  [new RegExp(`git tag v${SEMVER}`, 'g'), `git tag v${version}`],
  [new RegExp(`git push origin main develop v${SEMVER}`, 'g'), `git push origin main develop v${version}`],
  [new RegExp(`RELEASE_TAG=v${SEMVER}`, 'g'), `RELEASE_TAG=v${version}`],
  // Hotfix example: the patch release after this one.
  [new RegExp(`tag \`v${SEMVER}\``, 'g'), `tag \`v${nextPatch}\``],
]);

// Package READMEs — pinned install versions (npm install -D @ai-testing-tool/forge-cypress@x.y.z ...).
for (const dir of fs.readdirSync('.')) {
  if (!dir.startsWith('qa-')) continue;
  const readme = `${dir}/README.md`;
  if (!fs.existsSync(readme)) continue;
  rewrite(readme, [
    [new RegExp(`(@ai-testing-tool/forge-[a-z-]+)@${SEMVER}`, 'g'), `$1@${version}`],
  ]);
}
EOF

echo "Bumped all workspaces and doc references to $VERSION."
