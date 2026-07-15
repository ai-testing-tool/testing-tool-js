# qa-mocha

Mocha reporter for **QAnalyzer** (Jira Forge quality hub).

## Install

```bash
npm install -D qa-mocha qa-javascript-commons mocha
```

Peer: `mocha` ≥10.

## Configure

```js
// .mocharc.js
module.exports = {
  spec: ['test/**/*.spec.js'],
  reporter: 'qa-mocha',
  reporterOptions: {
    // Defaults to mode=off (no credentials required)
    // mode: 'ingest' | 'file' | 'off',
    // projectKey: 'DEMO',
  },
  timeout: 10000,
};
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
const { qa } = require('qa-mocha/mocha');
const assert = require('assert');

describe('JSONPlaceholder User CRUD', function () {
  it('AUTH-101 GET all users', async function () {
    qa.fields({ layer: 'api', severity: 'normal' });
    await qa.step('Send GET /users', async () => {
      const response = await fetch('https://jsonplaceholder.typicode.com/users');
      assert.strictEqual(response.status, 200);
    });
    // Sync steps also supported:
    qa.step('Validate title has issue key', () => {
      assert.ok(true);
    });
  });
});
```

Prefer **Jira issue keys in test titles** (no case-ID wrapper). Step hierarchy lands on `assertionResults[].meta.qa.steps`. Use `qa.attach({ contentType })` for attachment metadata (binary upload deferred).

## Dual path

**Path A — file + CLI:**

```bash
QANALYZER_MODE=file \
QANALYZER_PROJECT_KEY=DEMO \
npx mocha
npx qa-forge-api-client --project DEMO --report qanalyzer-results.json
```

**Path B — reporter ingest:**

```bash
QANALYZER_MODE=ingest \
QANALYZER_PROJECT_KEY=DEMO \
QANALYZER_INGEST_URL=... \
QANALYZER_INGEST_TOKEN=... \
npx mocha
```
