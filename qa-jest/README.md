# qa-jest

Jest reporter for **QAnalyzer** (Jira Forge quality hub).

## Install

```bash
npm install -D qa-jest qa-javascript-commons
```

## Configure

```js
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  reporters: [
    'default',
    [
      'qa-jest',
      {
        // Defaults to mode=off (no credentials required)
        // mode: 'ingest' | 'file' | 'off',
        // projectKey: 'DEMO',
      },
    ],
  ],
};
```

### Modes

| Mode | Behavior |
| ---- | -------- |
| `off` (default) | No network / file write |
| `file` | Writes ingest payload (default `./qanalyzer-results.json`) |
| `ingest` | POSTs the payload with `format: jest-json` |

Env (same as CLI): `QANALYZER_MODE`, `QANALYZER_PROJECT_KEY`, `QANALYZER_INGEST_URL`, `QANALYZER_INGEST_TOKEN`, `QANALYZER_LAUNCH_NAME`.

## Helpers

```js
const { qa } = require('qa-jest/jest');

test('AUTH-101 login', async () => {
  await qa.suite('Auth');
  await qa.step('open form', async () => {
    expect(true).toBe(true);
  });
});
```

Prefer **Jira issue keys in test titles**.

With the `qa-jest` reporter loaded (use `--runInBand` so helpers share the reporter bridge), `qa.*` metadata is attached as `assertionResults[].meta.qa` on Path B ingest/file.

## Dual path

**Path A — native JSON + CLI** (upload path; raw Jest JSON file):

```bash
npx jest --json --outputFile=qanalyzer-results.json
npx qa-forge-api-client --project DEMO --report qanalyzer-results.json
```

**Path B — qa-jest reporter** (`mode=ingest` or `mode=file`):

```bash
QANALYZER_MODE=ingest \
QANALYZER_PROJECT_KEY=DEMO \
QANALYZER_INGEST_URL=... \
QANALYZER_INGEST_TOKEN=... \
npx jest
```

`mode=file` writes an **ingest payload** (not raw Jest JSON). Path A and Path B produce schema-equivalent ingest payloads for the same run (`format: jest-json`, same assertion titles/statuses).
