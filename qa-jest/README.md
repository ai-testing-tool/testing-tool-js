# @ai-testing-tool/forge-jest

Jest reporter for **AI Testing Tool** (Jira Forge quality hub).

## Install

```bash
npm install -D @ai-testing-tool/forge-jest @ai-testing-tool/forge-commons
```

## Configure

```js
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  reporters: [
    'default',
    [
      '@ai-testing-tool/forge-jest',
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
| `file` | Writes ingest payload (default `./ai-testing-tool-results.json`) |
| `ingest` | POSTs the payload with `format: jest-json` |

Env (same as CLI): `AI_TESTING_TOOL_MODE`, `AI_TESTING_TOOL_PROJECT_KEY`, `AI_TESTING_TOOL_INGEST_URL`, `AI_TESTING_TOOL_INGEST_TOKEN`, `AI_TESTING_TOOL_LAUNCH_NAME`.

## Helpers

```js
const { qa } = require('@ai-testing-tool/forge-jest/jest');

test('AUTH-101 login', async () => {
  await qa.suite('Auth');
  await qa.step('open form', async () => {
    expect(true).toBe(true);
  });
});
```

Prefer **Jira issue keys in test titles**.

With the `@ai-testing-tool/forge-jest` reporter loaded (use `--runInBand` so helpers share the reporter bridge), `qa.*` metadata is attached as `assertionResults[].meta.qa` on Path B ingest/file.

## Dual path

**Path A — native JSON + CLI** (upload path; raw Jest JSON file):

```bash
npx jest --json --outputFile=ai-testing-tool-results.json
npx @ai-testing-tool/forge-api-client --project DEMO --report ai-testing-tool-results.json
```

**Path B — @ai-testing-tool/forge-jest reporter** (`mode=ingest` or `mode=file`):

```bash
AI_TESTING_TOOL_MODE=ingest \
AI_TESTING_TOOL_PROJECT_KEY=DEMO \
AI_TESTING_TOOL_INGEST_URL=... \
AI_TESTING_TOOL_INGEST_TOKEN=... \
npx jest
```

`mode=file` writes an **ingest payload** (not raw Jest JSON). Path A and Path B produce schema-equivalent ingest payloads for the same run (`format: jest-json`, same assertion titles/statuses).
