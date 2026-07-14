# qa-cypress

Cypress reporter + plugin for **QAnalyzer** (Jira Forge quality hub).

## Install

```bash
npm install -D qa-cypress qa-javascript-commons cypress-multi-reporters
```

Peer: `cypress` ≥12, `mocha` ≥10 (Cypress ships Mocha).

## Configure

```js
// cypress.config.js
const { defineConfig } = require('cypress');

module.exports = defineConfig({
  reporter: 'cypress-multi-reporters',
  reporterOptions: {
    reporterEnabled: 'qa-cypress',
    qaCypressReporterOptions: {
      // Defaults to mode=off (no credentials required)
      // mode: 'ingest' | 'file' | 'off',
      // projectKey: 'DEMO',
    },
  },
  e2e: {
    setupNodeEvents(on, config) {
      require('qa-cypress/plugin')(on, config);
      require('qa-cypress/metadata')(on);
      return config;
    },
  },
});
```

Direct reporter (no multi-reporters):

```js
reporter: 'qa-cypress',
```

**Required:** register `qa-cypress/plugin` so `after:run` publishes one FR41 launch for the whole `cypress run` (results are buffered across specs).

### Modes

| Mode | Behavior |
| ---- | -------- |
| `off` (default) | No network / file write |
| `file` | Writes FR41 ingest payload (default `./qanalyzer-results.json`) |
| `ingest` | POSTs FR41 with `format: jest-json` |

Env (same as CLI): `QANALYZER_MODE`, `QANALYZER_PROJECT_KEY`, `QANALYZER_INGEST_URL`, `QANALYZER_INGEST_TOKEN`, `QANALYZER_LAUNCH_NAME`.

Optional bridge path: `QANALYZER_CYPRESS_RESULTS_PATH` (default: `<projectRoot>/.qa-cypress-results.json`).

## Helpers

```js
const { qa } = require('qa-cypress/mocha');

it('AUTH-101 login', () => {
  qa.suite('Auth');
  qa.step('open form', () => {
    // synchronous callback only (FR64) — no async/await
    cy.visit('/login');
  });
});
```

Prefer **Jira issue keys in test titles**. Requires `qa-cypress/metadata` so `cy.task` bridges metadata to the Node reporter. Step hierarchy lands on `assertionResults[].meta.qa.steps`.

## Dual path

**Path A — file + CLI:**

```bash
QANALYZER_MODE=file \
QANALYZER_PROJECT_KEY=DEMO \
npx cypress run
npx qa-forge-api-client --project DEMO --report qanalyzer-results.json
```

(`mode=file` already writes an FR41 payload; CLI re-upload is optional if you prefer the upload workflow.)

**Path B — reporter ingest:**

```bash
QANALYZER_MODE=ingest \
QANALYZER_PROJECT_KEY=DEMO \
QANALYZER_INGEST_URL=... \
QANALYZER_INGEST_TOKEN=... \
npx cypress run
```
