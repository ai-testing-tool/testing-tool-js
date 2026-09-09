# @ai-testing-tool/forge-vitest

Vitest reporter for **AI Testing Tool** (Jira Forge quality hub).

## Install

```bash
npm install -D @ai-testing-tool/forge-vitest @ai-testing-tool/forge-commons
```

## Configure

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    reporters: [
      'default',
      [
        '@ai-testing-tool/forge-vitest',
        {
          // Defaults to mode=off (no credentials required)
          // mode: 'ingest' | 'file' | 'off',
          // projectKey: 'DEMO',
        },
      ],
    ],
  },
});
```

### Modes

| Mode | Behavior |
| ---- | -------- |
| `off` (default) | No network / file write |
| `file` | Writes ingest payload (default `./ai-testing-tool-results.json`) |
| `ingest` | POSTs the payload with `format: vitest-json` |

Env (same as CLI): `AI_TESTING_TOOL_MODE`, `AI_TESTING_TOOL_PROJECT_KEY`, `AI_TESTING_TOOL_INGEST_URL`, `AI_TESTING_TOOL_INGEST_TOKEN`, `AI_TESTING_TOOL_LAUNCH_NAME`.

## Helpers

```ts
import { describe, expect, test } from 'vitest';
import { withQa } from '@ai-testing-tool/forge-vitest/vitest';

test(
  'AUTH-101 login',
  withQa(async ({ qa }) => {
    await qa.suite('Auth');
    await qa.step('open form', async () => {
      expect(true).toBe(true);
    });
  })
);
```

Prefer **Jira issue keys in test titles**. Put competitive/reference notes in internal docs only — not in this package.

`withQa` / `qa.*` annotations are collected by the reporter into `assertionResults[].meta.qa` (suite, fields, steps, comments) on Path B ingest/file.

## Dual path

You can still use native JSON + CLI:

```bash
npx vitest run --reporter=json --outputFile=ai-testing-tool-results.json
npx @ai-testing-tool/forge-api-client --project DEMO --report ai-testing-tool-results.json
```
