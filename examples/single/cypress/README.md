# QAnalyzer Cypress Pilot Example

Saucedemo e-commerce E2E (`login`, `inventory`, `cart`, `checkout`) with Page Objects and **`qa-cypress`**.

Jira issue keys live in test titles (e.g. `AUTH-101 User can login with valid credentials`).

Default mode is **`off`** (no credentials). Graduate to `file` or `ingest` when ready.

## Prerequisites

- Node.js **18+**
- Network access to [saucedemo.com](https://www.saucedemo.com) for live E2E
- From monorepo: build reporters first (`cd qanalyzer-js && npm run build`)
- For ingest/upload: QAnalyzer Configure → Connection, project on allowlist

## Install & local run (no credentials)

```bash
cd qanalyzer-js
npm run build

cd examples/single/cypress
npm install
npm test
```

`npm test` runs `cypress run` with `QANALYZER_MODE=off` (default). Expect **13** tests (12 pass + 1 ignore demo that still executes).

Interactive:

```bash
npm run cypress:open
```

## Layout

```
cypress/
  e2e/           # login / inventory / cart / checkout specs
  support/
    commands.js  # cy.login()
    e2e.js
    pages/       # LoginPage, InventoryPage, CartPage, CheckoutPage
cypress.config.js
```

### `cy.login()`

```js
cy.login(); // standard_user / secret_sauce
cy.login('locked_out_user', 'secret_sauce');
```

### Sync `qa.step`

```js
import { qa } from 'qa-cypress/mocha';

it('AUTH-101 …', () => {
  qa.suite('E-commerce\tAuthentication\tLogin');
  qa.step('Fill in username', () => {
    LoginPage.fillUsername('standard_user'); // sync callback only — no async/await
  });
});
```

## Path A — `mode=file` + CLI

```bash
QANALYZER_MODE=file \
QANALYZER_PROJECT_KEY=AUTH \
npx cypress run --config video=false,screenshotOnRunFailure=false

npx qa-forge-api-client \
  --project AUTH \
  --launch "cypress pilot" \
  --report qanalyzer-results.json
```

Or:

```bash
npm run test:file
npm run upload
```

(`mode=file` writes a ready-to-ingest payload; CLI re-upload is optional if you already ingest elsewhere.)

## Path B — reporter `mode=ingest`

```bash
QANALYZER_MODE=ingest \
QANALYZER_PROJECT_KEY=AUTH \
QANALYZER_INGEST_URL=... \
QANALYZER_INGEST_TOKEN=... \
npx cypress run --config video=false,screenshotOnRunFailure=false
```

Requires `qa-cypress/plugin` + `qa-cypress/metadata` in `setupNodeEvents` (already wired in `cypress.config.js`).

### Environment

| Variable | Required | Description |
| -------- | -------- | ----------- |
| `QANALYZER_MODE` | No | `off` (default) \| `file` \| `ingest` |
| `QANALYZER_PROJECT_KEY` | file/ingest | Jira project key |
| `QANALYZER_INGEST_URL` | ingest | From Configure → Connection |
| `QANALYZER_INGEST_TOKEN` | ingest | Bearer token (CI secret) |
| `QANALYZER_LAUNCH_NAME` | No | Launch display name |

**Never commit the ingest token.**

## Issue key pattern

| Spec | Keys |
| ---- | ---- |
| login | AUTH-101 … AUTH-103 |
| inventory | AUTH-104 … AUTH-106 |
| cart | AUTH-107 … AUTH-109 |
| checkout | AUTH-110 … AUTH-113 (`AUTH-113` uses `qa.ignore()`) |
