# qa-forge-cypress

Cypress reporter + plugin for **QAnalyzer** (Jira Forge quality hub).

## Install

```bash
npm install -D qa-forge-cypress qa-forge-commons cypress-multi-reporters
```

Peer: `cypress` ≥12, `mocha` ≥10 (Cypress ships Mocha).

## Configure

```js
// cypress.config.js
const { defineConfig } = require('cypress');

module.exports = defineConfig({
  reporter: 'cypress-multi-reporters',
  reporterOptions: {
    reporterEnabled: 'qa-forge-cypress',
    qaCypressReporterOptions: {
      // Defaults to mode=off (no credentials required)
      // mode: 'ingest' | 'file' | 'off',
      // projectKey: 'DEMO',
      // resultsPath: './.qa-cypress-results.json',
    },
  },
  e2e: {
    setupNodeEvents(on, config) {
      require('qa-forge-cypress/plugin')(on, config);
      require('qa-forge-cypress/metadata')(on);
      return config;
    },
  },
});
```

Direct reporter (no multi-reporters):

```js
reporter: 'qa-forge-cypress',
```

**Required:** register `qa-forge-cypress/plugin` so `after:run` publishes one launch for the whole `cypress run` (results are buffered across specs).

### Modes

| Mode | Behavior |
| ---- | -------- |
| `off` (default) | No network / file write |
| `file` | Writes the ingest payload (default `./qanalyzer-results.json`) |
| `ingest` | POSTs the payload with `format: jest-json` |

Env (same as CLI): `QANALYZER_MODE`, `QANALYZER_PROJECT_KEY`, `QANALYZER_INGEST_URL`, `QANALYZER_INGEST_TOKEN`, `QANALYZER_LAUNCH_NAME`.

Results bridge path: `resultsPath` reporter option or `QANALYZER_CYPRESS_RESULTS_PATH` env var (default: `<projectRoot>/.qa-cypress-results.json`).

## Helpers

```js
const { qa } = require('qa-forge-cypress/mocha');

it('AUTH-101 login', () => {
  qa.suite('Auth');
  qa.step('open form', () => {
    // synchronous callback only — no async/await
    cy.visit('/login');
  });
});
```

All helpers: `qa.title(value)`, `qa.comment(value)`, `qa.suite(value)`, `qa.parameters({ key: value })`, `qa.ignore()`, `qa.step(name, syncFn)`. `qa.step()` throws if the callback returns a Promise — keep it synchronous and let Cypress commands queue as usual.

Prefer **Jira issue keys in test titles**. Requires `qa-forge-cypress/metadata` so `cy.task` bridges metadata to the Node reporter. Step hierarchy lands on `assertionResults[].meta.qa.steps`.

## Failure screenshots

With `qa-forge-cypress/plugin` registered, the `after:screenshot` hook records Cypress failure screenshots automatically. On publish (`mode=ingest` or `file`), each failed assertion gets a matching still image (png/jpeg/webp — videos are skipped) uploaded to Forge and attached as `meta.qa.attachments`. Screenshots are matched to assertions by test title, falling back to spec order; each screenshot is used at most once. Upload errors never fail the Cypress run.

## Dual path

**Path A — file + CLI:**

```bash
QANALYZER_MODE=file \
QANALYZER_PROJECT_KEY=DEMO \
npx cypress run
npx qa-forge-api-client --project DEMO --report qanalyzer-results.json
```

(`mode=file` already writes a ready-to-ingest payload; CLI re-upload is optional if you prefer the upload workflow.)

**Path B — reporter ingest:**

```bash
QANALYZER_MODE=ingest \
QANALYZER_PROJECT_KEY=DEMO \
QANALYZER_INGEST_URL=... \
QANALYZER_INGEST_TOKEN=... \
npx cypress run
```
