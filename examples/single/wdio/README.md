# QAnalyzer WebdriverIO Pilot Example

Saucedemo e-commerce E2E (`login`, `inventory`, `cart`, `checkout`) with Page Objects and **`@qanalyzer/forge-wdio`**.

Jira issue keys live in test titles (e.g. `AUTH-101 User can login with valid credentials`).

Steps use **`await qa.step()`** (including nested `step.step()`). Default mode is **`off`** (no credentials).

## Prerequisites

- Node.js **18+**
- Network access to [saucedemo.com](https://www.saucedemo.com) for live E2E
- Chrome (tests run **headless** by default)
- From monorepo: build reporters first (`cd qanalyzer-js && npm run build`)
- For ingest/upload: QAnalyzer Configure → Connection, project on allowlist

## Install & local run (no credentials)

```bash
cd qanalyzer-js
npm run build

cd examples/single/wdio
npm install
npm test
```

`npm test` runs `wdio run ./wdio.conf.js` with `QANALYZER_MODE=off` (default). Expect **13** tests (12 pass + 1 ignore demo that still executes).

## Layout

```
test/
  specs/               # Mocha: login, inventory, cart, checkout
  features/            # Cucumber: login.feature
  step-definitions/    # Cucumber steps
  pageobjects/         # LoginPage, InventoryPage, CartPage, CheckoutPage (getters)
  helpers/auth.js      # loginAsStandardUser (clears cookies + storage)
wdio.conf.js           # Mocha + @qanalyzer/forge-wdio
wdio.cucumber.conf.js  # Cucumber + useCucumber: true
```

`LoginPage.open()` clears cookies and `sessionStorage`/`localStorage` so cart state does not leak across tests in one browser session.

### Config sketch

```js
const QaWdioReporter = require('@qanalyzer/forge-wdio').default;
const { beforeRunHook, afterRunHook, QaWdioService } = require('@qanalyzer/forge-wdio');

exports.config = {
  reporters: [[QaWdioReporter, { disableWebdriverStepsReporting: true }]],
  services: [[QaWdioService, {}]],
  onPrepare: async () => { await beforeRunHook(); },
  onComplete: async () => { await afterRunHook(); },
};
```

**Required for ingest/file:** `beforeRunHook` / `afterRunHook` in `onPrepare` / `onComplete`.

### `await qa.step()`

```js
const { qa } = require('@qanalyzer/forge-wdio');

it('AUTH-101 …', async () => {
  qa.suite('E-commerce\\tAuthentication\\tLogin');
  await qa.step('Open login', async () => { /* … */ });
  await qa.step('Nested parent', async (step) => {
    await step.step('child', async () => { /* … */ });
  });
});
```

### `qa.attach({ type })`

Use **`type`** (not `contentType`). With content/path, uploads via Forge attach proxy (still images / small files).

## Cucumber path

```bash
npm run test:cucumber
# or:
QANALYZER_MODE=off npx wdio run ./wdio.cucumber.conf.js
```

Requires `@wdio/cucumber-framework`. Set **`useCucumber: true`** on the reporter. Prefer `@AUTH-101` tags or keys in the scenario title.

```
test/features/login.feature
test/step-definitions/login.steps.js
wdio.cucumber.conf.js
```

## Path B — `@qanalyzer/forge-wdio` reporter

**File mode:**

```bash
QANALYZER_MODE=file \
QANALYZER_PROJECT_KEY=AUTH \
npx wdio run ./wdio.conf.js

npm run upload
```

**Ingest mode:**

```bash
QANALYZER_MODE=ingest \
QANALYZER_PROJECT_KEY=AUTH \
QANALYZER_INGEST_URL=... \
QANALYZER_INGEST_TOKEN=... \
npx wdio run ./wdio.conf.js
```

### Environment

| Variable | Required | Description |
| -------- | -------- | ----------- |
| `QANALYZER_MODE` | No | `off` (default) \| `file` \| `ingest` |
| `QANALYZER_PROJECT_KEY` | file/ingest | Jira project key |
| `QANALYZER_INGEST_URL` | ingest | From Configure → Connection |
| `QANALYZER_INGEST_TOKEN` | ingest | Bearer token (CI secret) |
| `QANALYZER_LAUNCH_NAME` | No | Launch display name |

## Notes

- Mocha is the default path; Cucumber uses `wdio.cucumber.conf.js` + `useCucumber: true`.
