# Jest Example - API Testing with JSONPlaceholder

## Overview

This example demonstrates realistic API tests with Jest and **`@ai-testing-tool/forge-jest`**. Tests hit [JSONPlaceholder](https://jsonplaceholder.typicode.com) and cover CRUD, post validation, error handling, nested steps, suite hierarchy, attachments, and ignore — the same scenarios as the Qase Jest example, adapted to AI Testing Tool helpers.

Default mode is **`off`** (no credentials). Set `AI_TESTING_TOOL_MODE=ingest` in CI to upload launches to Jira.

## Prerequisites

- Node.js **18+** (native `fetch`)
- From monorepo: build reporters first (`cd ai-testing-tool-js && npm run build`)
- For ingest: AI Testing Tool → Settings → Automation setup (URL + token + project)

## Installation

```bash
cd ai-testing-tool-js
npm run build

cd examples/single/jest
npm install
```

## Configuration

**Environment variables:**

| Variable | Required | Description |
| -------- | -------- | ----------- |
| `AI_TESTING_TOOL_MODE` | No | `off` (default) \| `file` \| `ingest` |
| `AI_TESTING_TOOL_PROJECT_KEY` | file/ingest | Jira project key (e.g. `AUTH`) |
| `AI_TESTING_TOOL_INGEST_URL` | ingest | From Automation setup |
| `AI_TESTING_TOOL_INGEST_TOKEN` | ingest | Bearer token (CI secret) |
| `AI_TESTING_TOOL_LAUNCH_NAME` | No | Launch display name |

`jest.config.js` wires the reporter:

```js
reporters: [
  'default',
  ['@ai-testing-tool/forge-jest', { /* mode defaults to off */ }],
],
```

## Running Tests

```bash
# Local — no credentials
npm test

# Write ingest payload file
npm run test:file

# Upload to Forge
AI_TESTING_TOOL_MODE=ingest \
AI_TESTING_TOOL_PROJECT_KEY=AUTH \
AI_TESTING_TOOL_INGEST_URL=... \
AI_TESTING_TOOL_INGEST_TOKEN=... \
npm test
```

Optional Path A (native JSON + CLI, no reporter helpers needed for upload):

```bash
npm run test:json
npm run upload
```

## Test Scenarios

| File | Scenario | Description |
| ---- | -------- | ----------- |
| `api-crud.test.js` | User CRUD | GET list/single, POST create, DELETE |
| `api-posts.test.js` | Posts | List, filter by user, nested comments |
| `api-errors.test.js` | Errors | 404 handling, empty POST body |
| `api-advanced.test.js` | Advanced | Nested steps, suite hierarchy, parameters, ignore |

## Features Demonstrated

| Feature | Usage | Files |
| ------- | ----- | ----- |
| **Issue keys** (`qa.issueKeys()`) | FR43 — keys in `meta.qa`, not titles | All |
| **Fields** (`qa.fields()`) | severity, priority, layer | All |
| **Suite** (`qa.suite()`) | Tab-separated hierarchy | All |
| **Steps** (`qa.step()`) | Structured step reporting | All |
| **Parameters** (`qa.parameters()`) | Parameterized metadata | posts, advanced |
| **Labels** (`qa.labels()`) | Tags for filtering | crud |
| **Attachments** (`qa.attach()`) | JSON payloads | crud, posts, errors |
| **Comments** (`qa.comment()`) | Contextual notes | crud, errors, advanced |
| **Ignore** (`qa.ignore()` + `test.skip`) | Exclude from reporting | advanced |

## Helper pattern

```js
const { qa } = require('@ai-testing-tool/forge-jest/jest');

test('GET all users returns 10 users', async () => {
  await qa.issueKeys(['AUTH-101']);
  await qa.fields({ layer: 'api', severity: 'normal', priority: 'high' });
  await qa.suite('API Tests\tCRUD\tUsers');

  await qa.step('Send GET request to /users endpoint', async () => {
    const response = await fetch('https://jsonplaceholder.typicode.com/users');
    expect(response.status).toBe(200);
  });
});
```

Prefer **`qa.issueKeys()`** over embedding keys in titles.

## Issue key map

| Spec | Keys |
| ---- | ---- |
| api-crud | AUTH-101 … AUTH-104 |
| api-posts | AUTH-105 … AUTH-107 |
| api-errors | AUTH-108 … AUTH-111 |
| api-advanced | AUTH-112 … AUTH-116 (`AUTH-116` skipped + ignore) |

## Additional Resources

- Reporter package: [`qa-jest`](../../../qa-jest)
- Root SDK README: [`../../../README.md`](../../../README.md)
