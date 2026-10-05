# Playwright Example - E-commerce Test Suite

## Overview

Saucedemo e-commerce E2E (`login`, `inventory`, `cart`, `checkout`) with Page Objects and **`@ai-testing-tool/forge-playwright`**. Mirrors the Qase Playwright example scenarios, adapted to AI Testing Tool helpers.

Steps use Playwright native **`test.step()`** (do not use `qa.step` — FR112). Issue keys use **`qa.issueKeys()`** (not titles). Default mode is **`off`**.

## Prerequisites

- Node.js **18+**
- Network access to [saucedemo.com](https://www.saucedemo.com)
- From monorepo: `cd ai-testing-tool-js && npm run build`
- Chromium: `npm run install:browsers`

## Installation

```bash
cd ai-testing-tool-js
npm run build

cd examples/single/playwright
npm install
npm run install:browsers
```

## Configuration

| Variable | Required | Description |
| -------- | -------- | ----------- |
| `AI_TESTING_TOOL_MODE` | No | `off` (default) \| `file` \| `ingest` |
| `AI_TESTING_TOOL_PROJECT_KEY` | file/ingest | Jira project key |
| `AI_TESTING_TOOL_INGEST_URL` | ingest | From Automation setup |
| `AI_TESTING_TOOL_INGEST_TOKEN` | ingest | Bearer token (CI secret) |
| `AI_TESTING_TOOL_LAUNCH_NAME` | No | Launch display name |

## Running Tests

```bash
npm test

AI_TESTING_TOOL_MODE=file AI_TESTING_TOOL_PROJECT_KEY=AUTH npm test

AI_TESTING_TOOL_MODE=ingest \
AI_TESTING_TOOL_PROJECT_KEY=AUTH \
AI_TESTING_TOOL_INGEST_URL=... \
AI_TESTING_TOOL_INGEST_TOKEN=... \
npm test
```

## Test Scenarios

| File | Scenario | Description |
| ---- | -------- | ----------- |
| `login.spec.js` | Authentication | Valid login, invalid password, locked user |
| `inventory.spec.js` | Product browsing | Listing, sorting, detail page |
| `cart.spec.js` | Shopping cart | Add / remove / multiple items |
| `checkout.spec.js` | Checkout | Complete flow, validation, cancel, ignore demo |

## Features Demonstrated

| Feature | Usage |
| ------- | ----- |
| **Issue keys** | `qa.issueKeys(['AUTH-101'])` |
| **Fields** | `qa.fields({ severity, priority, layer })` |
| **Suite** | `qa.suite('E-commerce\\tAuthentication\\tLogin')` |
| **Steps** | Playwright `test.step()` |
| **Parameters** | `qa.parameters({ ... })` |
| **Labels** | `qa.labels(['smoke', 'e2e'])` |
| **Attachments** | `qa.attach({ name, content, contentType })` |
| **Comments** | `qa.comment(...)` |
| **Ignore** | `qa.ignore()` |

## Helper pattern

```js
const { test } = require('@playwright/test');
const { qa } = require('@ai-testing-tool/forge-playwright');

test('User can login with valid credentials', async ({ page }) => {
  qa.issueKeys(['AUTH-101']);
  qa.suite('E-commerce\tAuthentication\tLogin');
  await test.step('Fill in credentials and submit', async () => {
    // …
  });
});
```

## Issue key map

| Spec | Keys |
| ---- | ---- |
| login | AUTH-101 … AUTH-103 |
| inventory | AUTH-104 … AUTH-106 |
| cart | AUTH-107 … AUTH-109 |
| checkout | AUTH-110 … AUTH-113 (`AUTH-113` uses `qa.ignore()`) |

## Project Structure

```
test/
├── pages/          # LoginPage, InventoryPage, CartPage, CheckoutPage
├── login.spec.js
├── inventory.spec.js
├── cart.spec.js
└── checkout.spec.js
```
