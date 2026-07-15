# qanalyzer-js

JavaScript / TypeScript client SDK for **QAnalyzer** (Jira Forge quality hub): shared commons, an upload CLI, and reporters for the major JS test runners.

## Packages

| Package | Description |
| ------- | ----------- |
| [`qa-forge-commons`](./qa-javascript-commons/) | Shared config, models, and Forge ingest client |
| [`qa-forge-api-client`](./qa-forge-api-client/) | CLI — uploads Jest/Vitest JSON or JUnit XML reports |
| [`qa-forge-jest`](./qa-jest/) | Jest reporter |
| [`qa-forge-vitest`](./qa-vitest/) | Vitest reporter |
| [`qa-forge-mocha`](./qa-mocha/) | Mocha reporter |
| [`qa-forge-cypress`](./qa-cypress/) | Cypress reporter + plugin |
| [`qa-forge-playwright`](./qa-playwright/) | Playwright reporter |
| [`qa-forge-wdio`](./qa-wdio/) | WebdriverIO reporter + service (Mocha or Cucumber) |
| [`qa-forge-cucumberjs`](./qa-cucumberjs/) | CucumberJS formatter |

Ingest schema: [`schemas/ingest-payload.schema.json`](./schemas/ingest-payload.schema.json). Runnable projects for every runner live in [`examples/single/`](./examples/single/).

## Quick start

Pick the reporter for your test runner (see its README for setup), or upload an existing report from CI:

```bash
npx jest --json --outputFile=qanalyzer-results.json
npx qa-forge-api-client --project AUTH --report qanalyzer-results.json
```

Env: `QANALYZER_INGEST_URL`, `QANALYZER_INGEST_TOKEN` (from the QAnalyzer configure page), `QANALYZER_PROJECT_KEY`.

Reporters default to `mode: off` (no credentials required, no network); set `QANALYZER_MODE=ingest` in CI to publish launches, or `QANALYZER_MODE=file` to write the payload to disk.

### Optional JUnit XML (secondary)

Jest/Vitest JSON is the primary ingest format. For legacy JVM runners:

```bash
# Surefire / Gradle JUnit XML → Forge (server normalizes it)
npx qa-forge-api-client --project AUTH --report target/surefire-reports/TEST-*.xml --format junit-xml
```

Or curl the JSON envelope directly:

```bash
curl -X POST "$QANALYZER_INGEST_URL" \
  -H "Authorization: Bearer $QANALYZER_INGEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"projectKey\":\"AUTH\",\"format\":\"junit-xml\",\"report\":$(jq -Rs . < results.xml)}"
```

## Development

```bash
npm install
npm run build   # tsc for every workspace
npm test        # node --test suites for every workspace
```

npm workspaces monorepo; all `qa-*` directories are workspaces.

## Releasing

Packages are versioned in **lockstep** — every `qa-*` package carries the same version, and a `v<version>` git tag triggers the npm publish pipeline. The pipeline refuses to publish if any package version doesn't match the tag, publishes in dependency order (`qa-forge-commons` first), and skips already-published versions, so retrying a failed pipeline is safe.

### Git flow

Day-to-day work happens on feature branches merged into `develop` via merge requests. Releases go out from `main`:

```bash
# 1. Start from an up-to-date develop
git checkout develop && git pull

# 2. Bump every workspace to the release version (also updates package-lock.json)
npm version 1.1.0 --workspaces --no-git-tag-version
npm install

# 3. Verify locally
npm test
npm run release:dry

# 4. Commit the bump and merge to main
git commit -am "release: v1.1.0"
git checkout main && git pull
git merge --no-ff develop

# 5. Tag and push — the tag pipeline publishes to npm
git tag v1.1.0
git push origin main develop v1.1.0
```

### Hotfixes

Branch from `main`, fix, bump the patch version (step 2 above), tag `v1.1.1`, then merge `main` back into `develop` so the fix and version bump aren't lost.

Manual publish (bypassing CI): `npm run release` with an npm token configured. `RELEASE_TAG=v1.1.0 npm run release` additionally enforces the version check the pipeline uses.

## License

Apache-2.0
