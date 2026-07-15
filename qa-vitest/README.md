# qa-forge-vitest

Vitest reporter for **QAnalyzer** (Jira Forge quality hub).

## Install

```bash
npm install -D qa-forge-vitest qa-forge-commons
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
        'qa-forge-vitest',
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
| `file` | Writes ingest payload (default `./qanalyzer-results.json`) |
| `ingest` | POSTs the payload with `format: vitest-json` |

Env (same as CLI): `QANALYZER_MODE`, `QANALYZER_PROJECT_KEY`, `QANALYZER_INGEST_URL`, `QANALYZER_INGEST_TOKEN`, `QANALYZER_LAUNCH_NAME`.

## Helpers

```ts
import { describe, expect, test } from 'vitest';
import { withQa } from 'qa-forge-vitest/vitest';

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
npx vitest run --reporter=json --outputFile=qanalyzer-results.json
npx qa-forge-api-client --project DEMO --report qanalyzer-results.json
```
