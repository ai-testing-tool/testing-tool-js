# qa-forge-playwright

Playwright reporter for **QAnalyzer** (Jira Forge quality hub).

## Install

```bash
npm install -D qa-forge-playwright qa-forge-commons @playwright/test
```

Peer: `@playwright/test` ≥1.40.

## Configure

```js
// playwright.config.js
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './test',
  reporter: [
    ['list'],
    [
      'qa-forge-playwright',
      {
        // Defaults to mode=off (no credentials required)
        // mode: 'ingest' | 'file' | 'off',
        // projectKey: 'DEMO',
      },
    ],
  ],
});
```

### Modes

| Mode | Behavior |
| ---- | -------- |
| `off` (default) | No network / file write |
| `file` | Writes the ingest payload (default `./qanalyzer-results.json`) |
| `ingest` | POSTs the payload with `format: jest-json` |

Env (same as CLI): `QANALYZER_MODE`, `QANALYZER_PROJECT_KEY`, `QANALYZER_INGEST_URL`, `QANALYZER_INGEST_TOKEN`, `QANALYZER_LAUNCH_NAME`.

## Helpers

```js
const { test } = require('@playwright/test');
const { qa } = require('qa-forge-playwright');

test('AUTH-101 login', async ({ page }) => {
  qa.suite('Auth');
  qa.fields({ layer: 'e2e' });

  // Steps: native Playwright API only — no qa.step()
  await test.step('open login', async () => {
    await page.goto('/login');
  });
});
```

Prefer **Jira issue keys in test titles**. Native `test.step()` hierarchy lands on `assertionResults[].meta.qa.steps`.

`qa.attach({ contentType })` is metadata-only for now (binary upload deferred).

## Dual path

**Path A — Playwright JSON + CLI:**

```bash
npx playwright test --reporter=json --output=qanalyzer-playwright.json
# Convert / upload with CLI when using raw Playwright JSON, or prefer Path B file mode:
npx qa-forge-api-client --project DEMO --report qanalyzer-results.json
```

**Path B — qa-forge-playwright reporter** (`mode=ingest` or `mode=file`):

```bash
QANALYZER_MODE=ingest \
QANALYZER_PROJECT_KEY=DEMO \
QANALYZER_INGEST_URL=... \
QANALYZER_INGEST_TOKEN=... \
npx playwright test
```

`mode=file` writes an **ingest payload** (jest-json shape A) ready for Forge. Path A raw Playwright JSON is a separate dual-path option for teams that already emit Playwright's JSON reporter.
