# @ai-testing-tool/forge-mocha

Mocha reporter for **AI Testing Tool** (Jira Forge quality hub).

## Install

```bash
npm install -D @ai-testing-tool/forge-mocha @ai-testing-tool/forge-commons mocha
```

Peer: `mocha` ≥10.

## Configure

```js
// .mocharc.js
module.exports = {
  spec: ['test/**/*.spec.js'],
  reporter: '@ai-testing-tool/forge-mocha',
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
| `file` | Writes the ingest payload (default `./ai-testing-tool-results.json`) |
| `ingest` | POSTs the payload with `format: jest-json` |

Env (same as CLI): `AI_TESTING_TOOL_MODE`, `AI_TESTING_TOOL_PROJECT_KEY`, `AI_TESTING_TOOL_INGEST_URL`, `AI_TESTING_TOOL_INGEST_TOKEN`, `AI_TESTING_TOOL_LAUNCH_NAME`.

## Helpers

```js
const { qa } = require('@ai-testing-tool/forge-mocha/mocha');
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
AI_TESTING_TOOL_MODE=file \
AI_TESTING_TOOL_PROJECT_KEY=DEMO \
npx mocha
npx @ai-testing-tool/forge-api-client --project DEMO --report ai-testing-tool-results.json
```

**Path B — reporter ingest:**

```bash
AI_TESTING_TOOL_MODE=ingest \
AI_TESTING_TOOL_PROJECT_KEY=DEMO \
AI_TESTING_TOOL_INGEST_URL=... \
AI_TESTING_TOOL_INGEST_TOKEN=... \
npx mocha
```
