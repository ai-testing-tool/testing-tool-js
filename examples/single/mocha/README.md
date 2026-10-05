# Mocha Example - API Testing with JSONPlaceholder

## Overview

API tests against [JSONPlaceholder](https://jsonplaceholder.typicode.com/) using **`@ai-testing-tool/forge-mocha`**. Same scenario set as the Qase Mocha example: CRUD, posts, errors, nested steps, suite hierarchy, attachments, and ignore.

Issue keys use **`qa.issueKeys()`** (not titles). Default mode is **`off`**.

## Setup

```bash
cd ai-testing-tool-js
npm run build

cd examples/single/mocha
npm install
```

## Run

```bash
# no credentials (default)
npm test

# write the ingest payload file
npm run test:file

# ingest
AI_TESTING_TOOL_MODE=ingest \
AI_TESTING_TOOL_PROJECT_KEY=AUTH \
AI_TESTING_TOOL_INGEST_URL=... \
AI_TESTING_TOOL_INGEST_TOKEN=... \
npm test
```

## Test Scenarios

| File | Focus |
| ---- | ----- |
| `api-crud.spec.js` | User CRUD |
| `api-posts.spec.js` | Posts + filtering |
| `api-errors.spec.js` | 404 handling |
| `api-advanced.spec.js` | Nested steps, suite, parameters, ignore |

## Features Demonstrated

| Feature | Usage |
| ------- | ----- |
| **Issue keys** | `qa.issueKeys(['AUTH-101'])` |
| **Fields** | `qa.fields({ layer, severity })` |
| **Suite** | `qa.suite('API Tests\\tAdvanced\\t…')` |
| **Steps** | `await qa.step(name, fn)` (nested supported) |
| **Parameters** | `qa.parameters({ … })` |
| **Attachments** | `qa.attach({ name, content, contentType })` |
| **Comments** | `qa.comment(…)` |
| **Ignore** | `qa.ignore()` + `it.skip` |

## Helper pattern

```js
const { qa } = require('@ai-testing-tool/forge-mocha/mocha');

it('GET all users - verify 10 users returned', async function () {
  qa.issueKeys(['AUTH-101']);
  qa.fields({ layer: 'api', severity: 'normal' });

  await qa.step('Send GET request to /users endpoint', async () => {
    // …
  });
});
```

## Issue key map

| Spec | Keys |
| ---- | ---- |
| api-crud | AUTH-101 … AUTH-104 |
| api-posts | AUTH-105 … AUTH-107 |
| api-errors | AUTH-108 … AUTH-110 |
| api-advanced | AUTH-111 … AUTH-114 (`AUTH-114` skipped + ignore) |
