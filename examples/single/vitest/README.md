# QAnalyzer Vitest Pilot Example

JSONPlaceholder API scenarios (CRUD, posts, errors, advanced). Jira issue keys live in test titles (e.g. `AUTH-101 GET all users`).

**Default path (recommended for first launch):** native Vitest JSON → `qa-forge-api-client` → Forge ingest.  
**Optional path:** [`qa-vitest`](../../../qa-vitest) reporter (`mode=off` \| `file` \| `ingest`).

## Prerequisites

- Node.js **18+** (22 recommended)
- Network access to [jsonplaceholder.typicode.com](https://jsonplaceholder.typicode.com/)
- For upload/ingest: a configured QAnalyzer site (Connection tab) with your project on the allowlist

## Install & local run (no QAnalyzer credentials)

```bash
cd qanalyzer-js/examples/single/vitest
npm install
npm test
```

All tests should pass. No `QANALYZER_*` env vars are required. Default `vitest.config.ts` uses the `default` reporter only.

## Path A — CI upload (JSON + CLI)

Generate JSON, then upload with the Forge CLI client:

```bash
npx vitest run --reporter=json --outputFile=qanalyzer-results.json

npx qa-forge-api-client \
  --project AUTH \
  --launch "local smoke" \
  --report qanalyzer-results.json
```

Or use the package scripts:

```bash
npm run test:json
npm run upload
```

### Environment (Path A)

| Variable | Required | Description |
| -------- | -------- | ----------- |
| `QANALYZER_INGEST_URL` | Yes (upload) | Ingest URL from Configure → Connection |
| `QANALYZER_INGEST_TOKEN` | Yes (upload) | Bearer token (shown once on generate/rotate) |
| `QANALYZER_PROJECT_KEY` | Optional | Defaults via `--project` |

**Never commit the ingest token.** Prefer CI secrets from the Configure page **CI template** tab.

## Path B — Optional `qa-vitest` reporter

From the monorepo (after `npm run build` in `qanalyzer-js`):

```bash
npm install -D ../../../qa-vitest ../../../qa-javascript-commons
```

Example `vitest.config.ts` (keep Path A as default until you opt in):

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    reporters: [
      'default',
      [
        'qa-vitest',
        {
          // mode defaults to off — no credentials needed for local runs
          // mode: 'off' | 'file' | 'ingest',
          // projectKey: 'AUTH',
        },
      ],
    ],
  },
});
```

### Modes (`QANALYZER_MODE` or reporter options)

| Mode | Behavior |
| ---- | -------- |
| `off` (default) | No network / file write |
| `file` | Writes ingest payload (default `./qanalyzer-results.json`) |
| `ingest` | POSTs the payload with `format: vitest-json` (needs URL + token + project) |

Same secrets as Path A for `ingest`. For `file`, upload afterward with `qa-forge-api-client` if you want.

### `withQa` helpers

```ts
import { describe, expect, test } from 'vitest';
import { withQa } from 'qa-vitest/vitest';

test(
  'AUTH-101 GET all users',
  withQa(async ({ qa }) => {
    await qa.suite('User CRUD');
    await qa.step('fetch users', async () => {
      const res = await fetch('https://jsonplaceholder.typicode.com/users');
      expect(res.status).toBe(200);
    });
  }),
);
```

Await all `qa.*` calls except `qa.ignore()` (sync). Prefer **Jira keys in titles**; helpers add suite/step/fields metadata for richer launches.

This example’s tests stay plain Vitest (no `withQa`) so Path A stays zero-config.

## Optional: Test Plans

Attach a launch to a named plan (groups runs on the Jira project **Plans** tab):

```bash
export QANALYZER_PLAN_NAME=Smoke
# or: QANALYZER_PLAN_ID=<uuid> / QANALYZER_PLAN_KEY=smoke
# upload CLI: --plan Smoke | --plan-id <uuid> | --plan-key smoke
```

Plans do not run tests — CI still selects which files execute.

## Optional: Fix version / sprint tags

Tag launches for release filtering (project + global Quality pages):

```bash
export QANALYZER_FIX_VERSION=2.4.0
export QANALYZER_SPRINT="Sprint 42"
# upload CLI: --fix-version 2.4.0 --sprint "Sprint 42"
```

## Configure page

1. Jira → Manage apps → **QAnalyzer** (configure)
2. **Connection** — token + allowlist + connection test
3. **CI template** — GitHub + Vitest + project → Copy YAML (upload path today)

## Local vs CI

| Mode | Command | Forge contact |
| ---- | ------- | ------------- |
| Local | `npm test` | None |
| Path A | `npm run test:json` + `qa-forge-api-client` | Ingest URL + token |
| Path B | `QANALYZER_MODE=ingest` + `qa-vitest` reporter | Same secrets |

## Test map

| File | Coverage |
| ---- | -------- |
| `test/api-crud.test.ts` | Users CRUD (`AUTH-101`–`104`) |
| `test/api-posts.test.ts` | Posts + comments (`AUTH-105`–`107`) |
| `test/api-errors.test.ts` | 404 handling (`AUTH-108`–`110`) |
| `test/api-advanced.test.ts` | Nested flows + skip placeholder (`AUTH-111`–`114`) |

## Manual ingest smoke

1. Deploy/tunnel QAnalyzer with a configured site.
2. Path A: `npm run test:json` then upload — **or** Path B: `QANALYZER_MODE=ingest` with `qa-vitest`.
3. Open the Jira project page → **Test Launches** and confirm pass/fail counts and issue keys from titles.
