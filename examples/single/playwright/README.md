# QAnalyzer Playwright Pilot Example

Saucedemo e-commerce E2E (`login`, `inventory`, `cart`, `checkout`) with Page Objects and **`@qanalyzer/forge-playwright`**.

Jira issue keys live in test titles (e.g. `AUTH-101 User can login with valid credentials`).

Steps use Playwright native **`test.step()`** (no `qa.step`). Default mode is **`off`** (no credentials).

## Prerequisites

- Node.js **18+**
- Network access to [saucedemo.com](https://www.saucedemo.com) for live E2E
- From monorepo: build reporters first (`cd ai-testing-tool-js && npm run build`)
- Chromium via Playwright: `npm run install:browsers` (or `npx playwright install` / `install --with-deps` in CI)
- For ingest/upload: QAnalyzer Configure → Connection, project on allowlist

## Install & local run (no credentials)

```bash
cd ai-testing-tool-js
npm run build

cd examples/single/playwright
npm install
npm run install:browsers
npm test
```

`npm test` runs `playwright test` with `QANALYZER_MODE=off` (default). Expect **13** tests (12 pass + 1 ignore demo that still executes).

## Layout

```
test/
  login.spec.js
  inventory.spec.js
  cart.spec.js
  checkout.spec.js
  pages/          # LoginPage, InventoryPage, CartPage, CheckoutPage
playwright.config.js
```

### Native `test.step`

```js
const { test } = require('@playwright/test');
const { qa } = require('@qanalyzer/forge-playwright');

test('AUTH-101 …', async ({ page }) => {
  qa.suite('E-commerce\tAuthentication\tLogin');
  await test.step('Fill in credentials and submit', async () => {
    // …
  });
});
```

### `qa.attach({ contentType })`

Metadata-only stub in the cart spec — binary screenshot/video/trace upload is deferred.

## Path A — Playwright JSON + CLI

```bash
npx playwright test --reporter=json
# Prefer Path B file mode for the jest-json ingest shape, or upload a converted report:
npx @qanalyzer/forge-api-client --project AUTH --launch "playwright pilot" --report qanalyzer-results.json
```

## Path B — `@qanalyzer/forge-playwright` reporter

**File mode:**

```bash
QANALYZER_MODE=file \
QANALYZER_PROJECT_KEY=AUTH \
npx playwright test

npm run upload
```

**Ingest mode:**

```bash
QANALYZER_MODE=ingest \
QANALYZER_PROJECT_KEY=AUTH \
QANALYZER_INGEST_URL=... \
QANALYZER_INGEST_TOKEN=... \
npx playwright test
```

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
