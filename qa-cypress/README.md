# @ai-testing-tool/forge-cypress

Cypress reporter + plugin for **AI Testing Tool** (Jira Forge quality hub).

## Install

```bash
npm install -D @ai-testing-tool/forge-cypress@2.1.0 @ai-testing-tool/forge-commons@2.1.0 cypress-multi-reporters
```

The pinned versions above track the latest release; `npm run release:bump` keeps them in sync.

Peer: `cypress` ≥12, `mocha` ≥10 (Cypress ships Mocha).

## Configure

```js
// cypress.config.js
const { defineConfig } = require('cypress');

module.exports = defineConfig({
  reporter: 'cypress-multi-reporters',
  reporterOptions: {
    reporterEnabled: '@ai-testing-tool/forge-cypress',
    qaCypressReporterOptions: {
      // Defaults to mode=off (no credentials required)
      // mode: 'ingest' | 'file' | 'off',
      // projectKey: 'DEMO',
      // resultsPath: './.qa-cypress-results.json',
    },
  },
  e2e: {
    setupNodeEvents(on, config) {
      require('@ai-testing-tool/forge-cypress/plugin')(on, config);
      require('@ai-testing-tool/forge-cypress/metadata')(on);
      return config;
    },
  },
});
```

Direct reporter (no multi-reporters):

```js
reporter: '@ai-testing-tool/forge-cypress',
```

**Required:** register `@ai-testing-tool/forge-cypress/plugin` so `after:run` publishes one launch for the whole `cypress run` (results are buffered across specs).

### Modes

| Mode | Behavior |
| ---- | -------- |
| `off` (default) | No network / file write |
| `file` | Writes the ingest payload (default `./ai-testing-tool-results.json`) |
| `ingest` | POSTs the payload with `format: jest-json` |

Env (same as CLI): `AI_TESTING_TOOL_MODE`, `AI_TESTING_TOOL_PROJECT_KEY`, `AI_TESTING_TOOL_INGEST_URL`, `AI_TESTING_TOOL_INGEST_TOKEN`, `AI_TESTING_TOOL_LAUNCH_NAME`.

Results bridge path: `resultsPath` reporter option or `AI_TESTING_TOOL_CYPRESS_RESULTS_PATH` env var (default: `<projectRoot>/.qa-cypress-results.json`).

## Helpers

```js
const { qa } = require('@ai-testing-tool/forge-cypress/mocha');

it('AUTH-101 login', () => {
  qa.suite('Auth');
  qa.step('open form', () => {
    // synchronous callback only — no async/await
    cy.visit('/login');
  });
});
```

All helpers: `qa.title(value)`, `qa.comment(value)`, `qa.suite(value)`, `qa.suiteId(value)`, `qa.planId(value)`, `qa.plan(value)`, `qa.fixVersion(value)`, `qa.sprintName(value)`, `qa.labels(value)`, `qa.parameters({ key: value })`, `qa.ignore()`, `qa.step(name, syncFn)`. `qa.step()` throws if the callback returns a Promise — keep it synchronous and let Cypress commands queue as usual.

Prefer **Jira issue keys in test titles**. Requires `@ai-testing-tool/forge-cypress/metadata` so `cy.task` bridges metadata to the Node reporter. Step hierarchy lands on `assertionResults[].meta.qa.steps`.

## Failure screenshots

With `@ai-testing-tool/forge-cypress/plugin` registered, the `after:screenshot` hook records Cypress failure screenshots automatically. On publish (`mode=ingest` or `file`), each failed assertion gets a matching still image (png/jpeg/webp — videos are skipped) uploaded to Forge and attached as `meta.qa.attachments`. Screenshots are matched to assertions by test title, falling back to spec order; each screenshot is used at most once. Upload errors never fail the Cypress run.

## Dual path

**Path A — file + CLI:**

```bash
AI_TESTING_TOOL_MODE=file \
AI_TESTING_TOOL_PROJECT_KEY=DEMO \
npx cypress run
npx @ai-testing-tool/forge-api-client --project DEMO --report ai-testing-tool-results.json
```

(`mode=file` already writes a ready-to-ingest payload; CLI re-upload is optional if you prefer the upload workflow.)

**Path B — reporter ingest:**

```bash
AI_TESTING_TOOL_MODE=ingest \
AI_TESTING_TOOL_PROJECT_KEY=DEMO \
AI_TESTING_TOOL_INGEST_URL=... \
AI_TESTING_TOOL_INGEST_TOKEN=... \
npx cypress run
```
