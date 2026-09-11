# AI Testing Tool Jest Pilot Example

JSONPlaceholder API scenarios (CRUD, posts, errors, advanced). Jira issue keys live in test titles (e.g. `AUTH-101 GET all users`).

**Default path (recommended for first launch):** native Jest JSON → `@ai-testing-tool/forge-api-client` → Forge ingest.  
**Optional path:** [`@ai-testing-tool/forge-jest`](../../../qa-jest) reporter (`mode=off` \| `file` \| `ingest`).

## Prerequisites

- Node.js **18+** (22 recommended)
- Network access to [jsonplaceholder.typicode.com](https://jsonplaceholder.typicode.com/)
- For upload/ingest: a configured AiTestingTool site (Automation setup in project Settings) with your project connected

## Install & local run (no AiTestingTool credentials)

```bash
cd ai-testing-tool-js/examples/single/jest
npm install
npm test
```

All tests should pass (13 passed, 1 skipped). No `AI_TESTING_TOOL_*` env vars are required. Default `jest.config.js` uses the `default` reporter only.

## Path A — CI upload (JSON + CLI)

Generate JSON, then upload with the Forge CLI client:

```bash
npx jest --runInBand --json --outputFile=ai-testing-tool-results.json

npx @ai-testing-tool/forge-api-client \
  --project AUTH \
  --launch "local smoke" \
  --report ai-testing-tool-results.json
```

Or use the package scripts:

```bash
npm run test:json
npm run upload
```

### Environment (Path A)

| Variable | Required | Description |
| -------- | -------- | ----------- |
| `AI_TESTING_TOOL_INGEST_URL` | Yes (upload) | Ingest URL from project Settings → Automation setup |
| `AI_TESTING_TOOL_INGEST_TOKEN` | Yes (upload) | Bearer token (shown once on generate/rotate) |
| `AI_TESTING_TOOL_PROJECT_KEY` | Optional | Defaults via `--project` |

**Never commit the ingest token.** Prefer CI secrets from the **CI template** section in project Settings → Automation setup.

## Path B — Optional `@ai-testing-tool/forge-jest` reporter

From the monorepo (after `npm run build` in `ai-testing-tool-js`):

```bash
npm install -D ../../../qa-jest ../../../qa-javascript-commons
```

Example `jest.config.js` (keep Path A as default until you opt in):

```js
module.exports = {
  testEnvironment: 'node',
  testTimeout: 15_000,
  reporters: [
    'default',
    [
      '@ai-testing-tool/forge-jest',
      {
        // mode defaults to off — no credentials needed for local runs
        // mode: 'off' | 'file' | 'ingest',
        // projectKey: 'AUTH',
      },
    ],
  ],
};
```

### Modes (`AI_TESTING_TOOL_MODE` or reporter options)

| Mode | Behavior |
| ---- | -------- |
| `off` (default) | No network / file write |
| `file` | Writes the ingest payload (default `./ai-testing-tool-results.json`) |
| `ingest` | POSTs the payload with `format: jest-json` (needs URL + token + project) |

Same secrets as Path A for `ingest`.

### `qa` helpers

```js
const { qa } = require('@ai-testing-tool/forge-jest/jest');

test('AUTH-101 GET all users', async () => {
  await qa.suite('User CRUD');
  await qa.plan('Smoke');
  await qa.fixVersion('2.4.0');
  await qa.sprintName('Sprint 42');
  await qa.labels('test-auto,flaky');
  await qa.step('fetch users', async () => {
    const res = await fetch('https://jsonplaceholder.typicode.com/users');
    expect(res.status).toBe(200);
  });
  await qa.attach({
    name: 'response-sample.json',
    contentType: 'application/json',
    content: '{"ok":true}',
  });
});
```

Await all `qa.*` calls except `qa.ignore()` (sync). Prefer **Jira keys in titles**; helpers add suite/step/fields/plan/labels metadata for richer launches.

This example’s tests stay plain Jest (no `qa` imports) so Path A stays zero-config.

## Optional: Test Plans

Attach a launch to a named plan (groups runs on the Jira project **Plans** tab):

```bash
export AI_TESTING_TOOL_PLAN_NAME=Smoke
# or: AI_TESTING_TOOL_PLAN_ID=<uuid> / AI_TESTING_TOOL_PLAN_KEY=smoke
# upload CLI: --plan Smoke | --plan-id <uuid> | --plan-key smoke
```

Plans do not run tests — CI still selects which files execute.

## Optional: Fix version / sprint tags

Tag launches for release filtering (project + global Quality pages):

```bash
export AI_TESTING_TOOL_FIX_VERSION=2.4.0
export AI_TESTING_TOOL_SPRINT="Sprint 42"
# upload CLI: --fix-version 2.4.0 --sprint "Sprint 42"
```

## Automation setup

1. Open **AI Testing Tool** on your Jira project
2. Go to **Settings → Automation setup** — connect the project, copy the ingest token and URL, and run **Test connection**
3. Use the **CI template** builder to generate a pipeline snippet (Jest + project)

## Local vs CI

| Mode | Command | Forge contact |
| ---- | ------- | ------------- |
| Local | `npm test` | None |
| Path A | `npm run test:json` + `@ai-testing-tool/forge-api-client` | Ingest URL + token |
| Path B | `AI_TESTING_TOOL_MODE=ingest` + `@ai-testing-tool/forge-jest` reporter | Same secrets |

## Test map

| File | Coverage |
| ---- | -------- |
| `test/api-crud.test.ts` | Users CRUD (`AUTH-101`–`104`) |
| `test/api-posts.test.ts` | Posts + comments (`AUTH-105`–`107`) |
| `test/api-errors.test.ts` | 404 handling (`AUTH-108`–`110`) |
| `test/api-advanced.test.ts` | Nested flows + skip placeholder (`AUTH-111`–`114`) |

## Manual ingest smoke

1. Deploy/tunnel AiTestingTool with a configured site.
2. Path A: `npm run test:json` then upload — **or** Path B: `AI_TESTING_TOOL_MODE=ingest` with `@ai-testing-tool/forge-jest`.
3. Open the Jira project page → **Test Launches** and confirm pass/fail counts and issue keys from titles.
