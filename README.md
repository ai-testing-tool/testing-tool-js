# qanalyzer-js

JavaScript / TypeScript client SDK for **QAnalyzer** (Jira Forge quality hub): shared commons, an upload CLI, and reporters for the major JS test runners.

## Packages

| Package | Description |
| ------- | ----------- |
| [`@qanalyzer/forge-commons`](./qa-javascript-commons/) | Shared config, models, and Forge ingest client |
| [`@qanalyzer/forge-api-client`](./qa-forge-api-client/) | CLI — uploads Jest/Vitest JSON reports |
| [`@qanalyzer/forge-jest`](./qa-jest/) | Jest reporter |
| [`@qanalyzer/forge-vitest`](./qa-vitest/) | Vitest reporter |
| [`@qanalyzer/forge-mocha`](./qa-mocha/) | Mocha reporter |
| [`@qanalyzer/forge-cypress`](./qa-cypress/) | Cypress reporter + plugin |
| [`@qanalyzer/forge-playwright`](./qa-playwright/) | Playwright reporter |
| [`@qanalyzer/forge-wdio`](./qa-wdio/) | WebdriverIO reporter + service (Mocha or Cucumber) |
| [`@qanalyzer/forge-cucumberjs`](./qa-cucumberjs/) | CucumberJS formatter |

Ingest schema: [`schemas/ingest-payload.schema.json`](./schemas/ingest-payload.schema.json). Runnable projects for every runner live in [`examples/single/`](./examples/single/).

## Quick start

Pick the reporter for your test runner (see its README for setup), or upload an existing report from CI:

```bash
npx jest --json --outputFile=qanalyzer-results.json
npx @qanalyzer/forge-api-client --project AUTH --report qanalyzer-results.json
```

Env: `QANALYZER_INGEST_URL`, `QANALYZER_INGEST_TOKEN` (from the QAnalyzer configure page), `QANALYZER_PROJECT_KEY`.

Large reports: payloads above ~3.5 MB are uploaded automatically via the Forge web-trigger session/chunk API, with retries on transient errors (429/5xx/timeouts).

### 2.0.0 migration

- **Web-trigger only** — point `QANALYZER_INGEST_URL` at the Forge web trigger URL from project settings.
- **Removed** — `QANALYZER_FORGE_INGEST_URL`, `QANALYZER_FORGE_INGEST_TOKEN`, and ingest-gateway mode.
- **New (optional)** — `QANALYZER_INGEST_CHUNK_THRESHOLD_BYTES`, `QANALYZER_INGEST_CHUNK_MAX_BYTES`, `QANALYZER_INGEST_COMPLETE_TIMEOUT_MS`, `QANALYZER_INGEST_MAX_RETRIES`, `QANALYZER_INGEST_RETRY_BASE_DELAY_MS`.

Reporters default to `mode: off` (no credentials required, no network); set `QANALYZER_MODE=ingest` in CI to publish launches, or `QANALYZER_MODE=file` to write the payload to disk.

## Development

```bash
npm install
npm run build   # tsc for every workspace
npm test        # Vitest per package → qa-*/qanalyzer-results.json (+ pilot)
```

Each `qa-*` package writes **`qanalyzer-results.json` in its own directory** when tested. Upload all: `sh scripts/upload-package-reports.sh` (after `scripts/load-ingest-env.sh`).

npm workspaces monorepo; all `qa-*` directories are workspaces. Test runner: [`examples/single/vitest/vitest.config.ts`](./examples/single/vitest/vitest.config.ts).

## GitLab CI

[`.gitlab-ci.yml`](./.gitlab-ci.yml) runs `build` + `test` on every pipeline, uploads a Vitest pilot launch to Forge on `main` / `develop`, and publishes to npm on `v*.*.*` tags.

Ingest credentials match [`qanalyzer-app/.env`](../qanalyzer-app/.env) (`QANALYZER_INGEST_URL`, `QANALYZER_INGEST_TOKEN`). Set the same keys as **masked** GitLab CI/CD variables, or rely on `scripts/load-ingest-env.sh` when the app repo is checked out beside `qanalyzer-js` in a monorepo.

## Releasing

Packages are versioned in **lockstep** — every `qa-*` package carries the same version, and a `v<version>` git tag triggers the npm publish pipeline. The pipeline refuses to publish if any package version doesn't match the tag, publishes in dependency order (`@qanalyzer/forge-commons` first), and skips already-published versions, so retrying a failed pipeline is safe.

### Git flow

Day-to-day work happens on feature branches merged into `develop` via merge requests. Releases go out from `main`:

```bash
# 1. Start from an up-to-date develop
git checkout develop && git pull

# 2. Bump every workspace to the release version (also updates
#    package-lock.json and version references in the READMEs)
npm run release:bump 2.0.0

# 3. Verify locally
npm test
npm run release:dry

# 4. Commit the bump and merge to main
git commit -am "release: v2.0.0"
git checkout main && git pull
git merge --no-ff develop

# 5. Tag and push — the tag pipeline publishes to npm
git tag v2.0.0
git push origin main develop v2.0.0
```

### Hotfixes

Branch from `main`, fix, bump the patch version (step 2 above), tag `v2.0.1`, then merge `main` back into `develop` so the fix and version bump aren't lost.

Manual publish (bypassing CI): `npm run release` with an npm token configured. `RELEASE_TAG=v2.0.0 npm run release` additionally enforces the version check the pipeline uses.

## License

Apache-2.0
