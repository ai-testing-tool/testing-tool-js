# AI Testing Tool JavaScript SDK

Publish test results from JavaScript/TypeScript projects to **AI Testing Tool** — a Forge app that ingests Jest/Vitest JSON, stores launches, and syncs traceability to Jira.

> **Status:** Under active development. APIs and package versions may change between releases. Pin to a specific version (currently **2.0.0**) in production CI.

## What you get in Jira

AI Testing Tool adds a **Test Management** hub to your Jira project. The SDK is the CI bridge: after your pipeline runs, uploads appear as **launches** and sync to TestCase / TestExecution issues, feeding the views below.

### Key highlights

- **Jira-native TMS** — Requirements, TestCases, TestExecutions, and Bugs as named issue types; no separate test tool to manage
- **End-to-end workflow** — Requirements → Test Design → Test Execution → Test Pad, all inside the project page
- **CI ingest** — this SDK POSTs Jest/Vitest JSON to a Forge web trigger; launches sync to Jira on a schedule
- **Traceability** — link test cycles to stories/epics and see pass/fail coverage on any non-TestCase issue
- **Design vs execution** — TestCase holds design steps; each run clones a snapshot onto a TestExecution issue (same launch re-sync reuses that TE)
- **Issue panels** — TestCase, TestExecution, and Test results panels on Jira issues without leaving the issue view

| Area | What it does |
| ---- | ------------ |
| **Requirements** | Track requirement issues, link TestCases, and see coverage counts per requirement |
| **Test Design** | Organize TestCases in suite folders; edit steps, preconditions, and expected results |
| **Test Execution** | Run test cycles, track pass/fail/blocked per case, and see cycle-level progress |
| **Test Pad** | Execute tests step-by-step; record actual results, defects, attachments, and time |
| **Issue panels** | TestCase design/runs on TestCase issues; run history on TestExecution; coverage on stories/epics |

### Requirements

Link TestCases to requirements and see how many cases cover each need.

![Requirements view — requirement issues with linked test case counts](./media/requirement.png)

### Test Design

Build and organize TestCases in a suite tree. Design detail (steps, expected results) lives on the TestCase — separate from execution snapshots.

![Test Design — suite folders and TestCase list](./media/test_design.png)

### Test Execution

Manage test cycles, assign cases, set run status (Passed, Failed, Blocked, Skipped), and monitor cycle progress. **CI uploads from this SDK populate launches here** after ingest sync completes.

![Test Execution — cycle progress and per-case run status](./media/test_execution.png)

### Test Pad

Record manual or exploratory runs step-by-step on a TestExecution issue: expected vs actual, defects, attachments, and work logging. CI uploads create TestExecution issues with step snapshots cloned from the linked TestCase.

![Test Pad — step execution on a TestExecution issue](./media/test_pad.png)

### Issue panels (Jira issue view)

Beyond the project hub, AI Testing Tool adds context on individual issues:

- **TestCase panel** — design detail, linked defects, test runs, and quick navigation to Test Design
- **Test Execution panel** — linked TestCase, launch history, and run status on TestExecution issues
- **Test results panel** — link test cycles to stories/epics and see executed/passed/failed coverage

These panels complement CI ingest: automated runs land as launches and TestExecutions; panels surface that history on the issues your team already works in.

### From CI to Jira (SDK role)

```text
Your test runner  →  @ai-testing-tool/forge-* reporter or CLI  →  Forge web trigger
                                                              ↓
                                                    Launch stored in AI Testing Tool
                                                              ↓
                              TestCase / TestExecution issues + Test Execution view updated
```

- **Automated CI:** set `AI_TESTING_TOOL_MODE=ingest` — reporters upload when the run finishes.
- **Optional metadata:** set Jira issue keys via `qa.issueKeys()` (or Cucumber `@AUTH-101` tags) — stored in `meta.qa.issueKeys`, not in test titles.
- **Rich steps:** use `qa.suite` / `qa.step` (Jest, Vitest, Mocha, Cypress, WDIO), Playwright `test.step()`, or Cucumber tags — suite hierarchy appears in ingest payloads.
- **Large suites:** reports above ~3.5 MB chunk automatically; transient upload errors retry.

Configure ingest in Jira under **Test Management → Settings → Automation setup**.

## Who this is for

Use this SDK if you:

- Run tests with **Jest, Vitest, Mocha, Cypress, Playwright, WebdriverIO, or CucumberJS**
- Have **AI Testing Tool** installed on your Jira Cloud site
- Want CI (or local runs) to **upload a launch** after tests finish

You do **not** need to run any extra server. Uploads go directly to the Forge **web trigger** URL from your project settings.

## Before you start

1. **Install AI Testing Tool** on your Jira site and open a project.
2. Go to **Test Management → Settings → Automation setup**.
3. Connect the project and **generate an ingest token** (shown once — store it in CI secrets).
4. Copy the **ingest URL** (Forge web trigger) from the same screen.

You need three values for CI:

| Variable | Where to get it |
| -------- | --------------- |
| `AI_TESTING_TOOL_INGEST_URL` | Automation setup → ingest URL |
| `AI_TESTING_TOOL_INGEST_TOKEN` | Automation setup → token (Bearer) |
| `AI_TESTING_TOOL_PROJECT_KEY` | Your Jira project key (e.g. `AUTH`) |

Use **Test connection** in Automation setup to verify credentials without putting the token in a browser network tab.

## Getting started

All reporters default to `mode: off` — local runs need no credentials. Set `AI_TESTING_TOOL_MODE=ingest` in CI to upload. Link tests to Jira issues with `qa.issueKeys(['AUTH-101'])` (or `@AUTH-101` tags in Cucumber) — keys land in `meta.qa.issueKeys`.

**CI environment** (same for every framework):

```bash
export AI_TESTING_TOOL_MODE=ingest
export AI_TESTING_TOOL_PROJECT_KEY=AUTH
export AI_TESTING_TOOL_INGEST_URL="https://<your-site>.atlassian.net/.../ai-testing-tool-ingest-launch"
export AI_TESTING_TOOL_INGEST_TOKEN="<token-from-settings>"
export AI_TESTING_TOOL_LAUNCH_NAME="CI #${CI_PIPELINE_ID:-local}"
```

HTTP **201** with `{ "ok": true }` means the launch was accepted. Check **Test Management** in Jira after sync (usually within a few minutes).

### Vitest

```bash
npm install -D @ai-testing-tool/forge-vitest @ai-testing-tool/forge-commons
```

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    reporters: [
      'default',
      ['@ai-testing-tool/forge-vitest', { projectKey: 'AUTH' }],
    ],
  },
});
```

```ts
// login.test.ts
import { expect, test } from 'vitest';
import { withQa } from '@ai-testing-tool/forge-vitest/vitest';

test(
  'login succeeds',
  withQa(async ({ qa }) => {
    await qa.issueKeys(['AUTH-101']);
    await qa.suite('Authentication');
    await qa.step('submit valid credentials', async () => {
      expect(true).toBe(true);
    });
  }),
);
```

```bash
npx vitest run
```

### Jest

```bash
npm install -D @ai-testing-tool/forge-jest @ai-testing-tool/forge-commons
```

```js
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  reporters: [
    'default',
    ['@ai-testing-tool/forge-jest', { projectKey: 'AUTH' }],
  ],
};
```

```js
// login.test.js
const { qa } = require('@ai-testing-tool/forge-jest/jest');

test('login succeeds', async () => {
  await qa.issueKeys(['AUTH-101']);
  await qa.suite('Authentication');
  await qa.step('submit valid credentials', async () => {
    expect(true).toBe(true);
  });
});
```

```bash
npx jest --runInBand
```

Use `--runInBand` so `qa.*` helpers share the reporter bridge.

### Mocha

```bash
npm install -D @ai-testing-tool/forge-mocha @ai-testing-tool/forge-commons mocha
```

```js
// .mocharc.js
module.exports = {
  spec: ['test/**/*.spec.js'],
  reporter: '@ai-testing-tool/forge-mocha',
  reporterOptions: { projectKey: 'AUTH' },
};
```

```js
// login.spec.js
const { qa } = require('@ai-testing-tool/forge-mocha/mocha');
const assert = require('assert');

describe('Authentication', function () {
  it('login succeeds', async function () {
    qa.issueKeys(['AUTH-101']);
    await qa.step('submit valid credentials', async () => {
      assert.strictEqual(true, true);
    });
  });
});
```

```bash
npx mocha
```

### Playwright

```bash
npm install -D @ai-testing-tool/forge-playwright @ai-testing-tool/forge-commons @playwright/test
```

```js
// playwright.config.js
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './test',
  reporter: [
    ['list'],
    ['@ai-testing-tool/forge-playwright', { projectKey: 'AUTH' }],
  ],
});
```

```js
// login.spec.js
const { test } = require('@playwright/test');
const { qa } = require('@ai-testing-tool/forge-playwright');

test('login succeeds', async ({ page }) => {
  qa.issueKeys(['AUTH-101']);
  qa.suite('Authentication');
  await test.step('open login page', async () => {
    await page.goto('/login');
  });
});
```

Use native Playwright `test.step()` for step hierarchy — there is no `qa.step()`.

```bash
npx playwright test
```

### Cypress

```bash
npm install -D @ai-testing-tool/forge-cypress @ai-testing-tool/forge-commons cypress-multi-reporters
```

```js
// cypress.config.js
const { defineConfig } = require('cypress');

module.exports = defineConfig({
  reporter: 'cypress-multi-reporters',
  reporterOptions: {
    reporterEnabled: '@ai-testing-tool/forge-cypress',
    qaCypressReporterOptions: { projectKey: 'AUTH' },
  },
  e2e: {
    setupNodeEvents(on, config) {
      require('@ai-testing-tool/forge-cypress/plugin')(on, config);
      require('@ai-testing-tool/forge-cypress/metadata')(on);
      return config;
    },
  },
});
```

```js
// cypress/e2e/login.cy.js
const { qa } = require('@ai-testing-tool/forge-cypress/mocha');

it('login succeeds', () => {
  qa.issueKeys(['AUTH-101']);
  qa.suite('Authentication');
  qa.step('open login page', () => {
    cy.visit('/login');
  });
});
```

Register the **plugin** and **metadata** hooks so one launch is published for the whole `cypress run`. `qa.step()` callbacks must be synchronous.

```bash
npx cypress run
```

### WebdriverIO (Mocha)

```bash
npm install -D @ai-testing-tool/forge-wdio @ai-testing-tool/forge-commons @wdio/mocha-framework
```

```js
// wdio.conf.js
const QaWdioReporter = require('@ai-testing-tool/forge-wdio').default;
const { beforeRunHook, afterRunHook, QaWdioService } = require('@ai-testing-tool/forge-wdio');

exports.config = {
  specs: ['./test/specs/**/*.spec.js'],
  framework: 'mocha',
  reporters: [[QaWdioReporter, { projectKey: 'AUTH' }]],
  services: [[QaWdioService, {}]],
  onPrepare: async () => { await beforeRunHook(); },
  onComplete: async () => { await afterRunHook(); },
};
```

```js
// test/specs/login.spec.js
const { qa } = require('@ai-testing-tool/forge-wdio');

describe('Authentication', () => {
  it('login succeeds', async () => {
    qa.issueKeys(['AUTH-101']);
    qa.suite('Authentication');
    await qa.step('submit valid credentials', async () => {
      await expect(browser).toHaveUrl(expect.stringContaining('/'));
    });
  });
});
```

`onPrepare` / `onComplete` hooks are required for ingest and file modes. For Cucumber, set `useCucumber: true` on the reporter — see [`qa-wdio/README.md`](./qa-wdio/README.md).

```bash
npx wdio run wdio.conf.js
```

### CucumberJS

```bash
npm install -D @ai-testing-tool/forge-cucumberjs @ai-testing-tool/forge-commons @cucumber/cucumber
```

```js
// cucumber.js
module.exports = {
  default: {
    format: ['progress', '@ai-testing-tool/forge-cucumberjs'],
    require: ['step_definitions/**/*.js'],
    formatOptions: { projectKey: 'AUTH' },
  },
};
```

```gherkin
# features/login.feature
@AUTH-101 @QaSuite=Authentication
Feature: Login

  Scenario: User logs in with valid credentials
    Given the login page is open
    When the user submits valid credentials
    Then the dashboard is shown
```

Metadata is tag-based — no `qa` import. The `@AUTH-101` tag sets `meta.qa.issueKeys`; Gherkin steps become `meta.qa.steps` in the ingest payload.

```bash
npx cucumber-js
```

### CLI (JSON upload)

Use when you already emit Jest/Vitest JSON and do not want a reporter:

```bash
npm install -D @ai-testing-tool/forge-api-client

npx vitest run --reporter=json --outputFile=ai-testing-tool-results.json
# or: npx jest --json --outputFile=ai-testing-tool-results.json

npx @ai-testing-tool/forge-api-client \
  --project AUTH \
  --report ai-testing-tool-results.json \
  --launch "nightly regression"
```

Package-specific details: [`qa-vitest`](./qa-vitest/), [`qa-jest`](./qa-jest/), [`qa-mocha`](./qa-mocha/), [`qa-playwright`](./qa-playwright/), [`qa-cypress`](./qa-cypress/), [`qa-wdio`](./qa-wdio/), [`qa-cucumberjs`](./qa-cucumberjs/), [`qa-forge-api-client`](./qa-forge-api-client/).

## Quick start

### Option A — Reporter (recommended)

Pick your framework in [Getting started](#getting-started) above — install, config, test sample, and run command for each runner.

### Option B — CLI upload

Generate a Jest/Vitest JSON file, then upload with the CLI:

```bash
npm install -D @ai-testing-tool/forge-api-client

npx vitest run --reporter=json --outputFile=ai-testing-tool-results.json
# or: npx jest --json --outputFile=ai-testing-tool-results.json

npx @ai-testing-tool/forge-api-client \
  --project AUTH \
  --report ai-testing-tool-results.json \
  --launch "nightly regression"
```

Same env vars apply (`AI_TESTING_TOOL_INGEST_URL`, `AI_TESTING_TOOL_INGEST_TOKEN`).

### CI example (GitHub Actions)

```yaml
- name: Run tests
  run: npx vitest run
  env:
    AI_TESTING_TOOL_MODE: ingest
    AI_TESTING_TOOL_PROJECT_KEY: AUTH
    AI_TESTING_TOOL_INGEST_URL: ${{ secrets.AI_TESTING_TOOL_INGEST_URL }}
    AI_TESTING_TOOL_INGEST_TOKEN: ${{ secrets.AI_TESTING_TOOL_INGEST_TOKEN }}
    AI_TESTING_TOOL_LAUNCH_NAME: ${{ github.workflow }} #${{ github.run_number }}
```

Reporters default to **`mode: off`** locally so `npm test` works without credentials. Set `AI_TESTING_TOOL_MODE=ingest` only in CI (or when you explicitly want to publish).

## Packages

| npm package | Use when |
| ----------- | -------- |
| [`@ai-testing-tool/forge-jest`](./qa-jest/) | Jest |
| [`@ai-testing-tool/forge-vitest`](./qa-vitest/) | Vitest |
| [`@ai-testing-tool/forge-mocha`](./qa-mocha/) | Mocha |
| [`@ai-testing-tool/forge-cypress`](./qa-cypress/) | Cypress |
| [`@ai-testing-tool/forge-playwright`](./qa-playwright/) | Playwright |
| [`@ai-testing-tool/forge-wdio`](./qa-wdio/) | WebdriverIO (Mocha or Cucumber) |
| [`@ai-testing-tool/forge-cucumberjs`](./qa-cucumberjs/) | CucumberJS |
| [`@ai-testing-tool/forge-api-client`](./qa-forge-api-client/) | Upload an existing JSON report (no reporter) |
| [`@ai-testing-tool/forge-commons`](./qa-javascript-commons/) | Shared types/client (usually a transitive dependency) |

Runnable examples for every runner: [`examples/single/`](./examples/single/).  
Ingest payload schema: [`schemas/ingest-payload.schema.json`](./schemas/ingest-payload.schema.json).

## Configuration

### Modes

| `AI_TESTING_TOOL_MODE` | Behavior |
| ---------------- | -------- |
| `off` (default) | No upload, no file write — safe for local dev |
| `ingest` | POST results to the Forge web trigger |
| `file` | Write ingest payload to disk (default `./ai-testing-tool-results.json`) |

### Common environment variables

| Variable | Required | Description |
| -------- | -------- | ----------- |
| `AI_TESTING_TOOL_INGEST_URL` | ingest mode | Forge web trigger URL from Automation setup |
| `AI_TESTING_TOOL_INGEST_TOKEN` | ingest mode | Bearer token from Automation setup |
| `AI_TESTING_TOOL_PROJECT_KEY` | yes | Jira project key |
| `AI_TESTING_TOOL_LAUNCH_NAME` | no | Display name for the launch (defaults vary by runner) |
| `AI_TESTING_TOOL_PLAN_ID` / `PLAN_KEY` / `PLAN_NAME` | no | Link launch to a test plan / cycle |
| `AI_TESTING_TOOL_FIX_VERSION` / `AI_TESTING_TOOL_SPRINT` | no | Version tags on the launch |

### Large reports

Payloads above **~3.5 MB** are uploaded automatically using the Forge **session → chunk → complete** flow. Transient errors (**429**, **5xx**, timeouts) are retried with backoff.

Optional tuning:

| Variable | Default | Purpose |
| -------- | ------- | ------- |
| `AI_TESTING_TOOL_INGEST_CHUNK_THRESHOLD_BYTES` | 3500000 | Switch from single POST to chunked upload |
| `AI_TESTING_TOOL_INGEST_CHUNK_MAX_BYTES` | 3000000 | Max size per chunk body |
| `AI_TESTING_TOOL_INGEST_COMPLETE_TIMEOUT_MS` | 120000 | Timeout for the final `complete` step |
| `AI_TESTING_TOOL_INGEST_MAX_RETRIES` | 4 | Retry attempts (including the first try) |
| `AI_TESTING_TOOL_INGEST_TIMEOUT_MS` | 60000 | Per-request timeout |

### Success criteria

- HTTP **201** with body `{ "ok": true }` means the launch was accepted.
- Open the Jira project **Test Management** page to see the launch and sync status.
- Jira issue creation (TestCase / TestExecution) runs asynchronously after ingest — allow a few minutes under load.

## Upgrading to 2.0.0

Breaking changes from 1.x:

- **Web-trigger only** — `AI_TESTING_TOOL_INGEST_URL` must be the Forge web trigger URL (not an ingest gateway).
- **Removed** — `AI_TESTING_TOOL_FORGE_INGEST_URL`, `AI_TESTING_TOOL_FORGE_INGEST_TOKEN`, ingest-gateway mode.
- **Added** — automatic chunked upload and retry (see above).

```bash
npm install -D @ai-testing-tool/forge-vitest@2.0.0 @ai-testing-tool/forge-commons@2.0.0
```

## Troubleshooting

| Symptom | Likely cause |
| ------- | ------------ |
| `401 Unauthorized` | Wrong or missing `AI_TESTING_TOOL_INGEST_TOKEN` |
| `403 Forbidden` | Project not connected in Automation setup |
| `503 AI Testing Tool not configured` | Site/project not set up yet |
| Launch missing in Jira | Check sync status on Test Management; large suites sync on a schedule |
| Payload too large | Chunking handles most cases; split CI jobs if you hit the 100-chunk limit |

## Contributing (maintainers)

This repo is an npm workspaces monorepo (`qa-*` packages, lockstep versions).

```bash
npm install
npm run build
npm test
```

- Each package writes `ai-testing-tool-results.json` in its directory during tests.
- Upload all package reports: `sh scripts/load-ingest-env.sh && sh scripts/upload-package-reports.sh`
- Vitest workspace config: [`examples/single/vitest/vitest.config.ts`](./examples/single/vitest/vitest.config.ts)

### CI

[`.gitlab-ci.yml`](./.gitlab-ci.yml) runs build + test on every pipeline, uploads a pilot launch on `main`/`develop`, and publishes to npm on `v*.*.*` tags. For local uploads, put ingest credentials in a gitignored `.env` (see `scripts/load-ingest-env.sh`).

### Releasing

Lockstep version across all packages. Tag `v2.0.0` triggers the publish pipeline.

```bash
npm run release:bump 2.0.0
npm test && npm run release:dry
git commit -am "release: v2.0.0"
git tag v2.0.0 && git push origin main develop v2.0.0
```

Manual publish: `RELEASE_TAG=v2.0.0 npm run release` (requires npm token).

## License

Apache-2.0
