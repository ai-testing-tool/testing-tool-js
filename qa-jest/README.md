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
| `ingest` | POSTs FR41 with `format: jest-json` |

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

## Dual path

You can still use native JSON + CLI:

```bash
npx jest --json --outputFile=qanalyzer-results.json
npx qa-forge-api-client --project DEMO --report qanalyzer-results.json
```
