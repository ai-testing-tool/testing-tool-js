# @ai-testing-tool/forge-wdio

WebdriverIO reporter + service for **AI Testing Tool** (Jira Forge quality hub).

Supports **WebdriverIO 8+** with **Mocha** (`@wdio/mocha-framework`) or **Cucumber** (`@wdio/cucumber-framework`).

## Install

```bash
# Mocha (default)
npm install -D @ai-testing-tool/forge-wdio @ai-testing-tool/forge-commons @wdio/mocha-framework

# Cucumber
npm install -D @ai-testing-tool/forge-wdio @ai-testing-tool/forge-commons @wdio/cucumber-framework
```

## Configure — Mocha

```js
// wdio.conf.js
const QaWdioReporter = require('@ai-testing-tool/forge-wdio').default;
const { beforeRunHook, afterRunHook, QaWdioService } = require('@ai-testing-tool/forge-wdio');

exports.config = {
  specs: ['./test/specs/**/*.spec.js'],
  baseUrl: 'https://www.saucedemo.com',
  framework: 'mocha',
  reporters: [
    [
      QaWdioReporter,
      {
        // Defaults to mode=off (no credentials required)
        // mode: 'ingest' | 'file' | 'off',
        // projectKey: 'DEMO',
        disableWebdriverStepsReporting: true, // default
      },
    ],
  ],
  services: [[QaWdioService, {}]],
  capabilities: [
    {
      browserName: 'chrome',
      'goog:chromeOptions': { args: ['--headless', '--disable-gpu'] },
    },
  ],
  onPrepare: async function () {
    await beforeRunHook();
  },
  onComplete: async function () {
    await afterRunHook();
  },
};
```

## Configure — Cucumber

```js
// wdio.cucumber.conf.js
const QaWdioReporter = require('@ai-testing-tool/forge-wdio').default;
const { beforeRunHook, afterRunHook, QaWdioService } = require('@ai-testing-tool/forge-wdio');

exports.config = {
  specs: ['./test/features/**/*.feature'],
  framework: 'cucumber',
  cucumberOpts: {
    require: ['./test/step-definitions/**/*.js'],
  },
  reporters: [
    [
      QaWdioReporter,
      {
        useCucumber: true, // scenario → one result; Gherkin steps → meta.qa.steps
        disableWebdriverStepsReporting: true,
      },
    ],
  ],
  services: [[QaWdioService, {}]],
  onPrepare: async () => { await beforeRunHook(); },
  onComplete: async () => { await afterRunHook(); },
};
```

Tag conventions:

- Prefer **Jira keys in the scenario title** or bare tags: `@AUTH-101`
- Optional metadata: `@QaSuite=Checkout`, `@QaTitle=…`, `@QaFields={"layer":"e2e"}`

See `examples/single/wdio/wdio.cucumber.conf.js`.

**Required for ingest/file:** `onPrepare` → `beforeRunHook` and `onComplete` → `afterRunHook`.

### Modes

| Mode | Behavior |
| ---- | -------- |
| `off` (default) | No network / file write |
| `file` | Writes the ingest payload (default `./ai-testing-tool-results.json`) |
| `ingest` | POSTs the payload with `format: jest-json` |

Env: `AI_TESTING_TOOL_MODE`, `AI_TESTING_TOOL_PROJECT_KEY`, `AI_TESTING_TOOL_INGEST_URL`, `AI_TESTING_TOOL_INGEST_TOKEN`, `AI_TESTING_TOOL_LAUNCH_NAME`.

## Helpers (Mocha)

```js
const { qa } = require('@ai-testing-tool/forge-wdio');
const LoginPage = require('../pageobjects/LoginPage');

describe('Login', () => {
  it('AUTH-101 User can login with valid credentials', async () => {
    qa.fields({ severity: 'critical', layer: 'e2e' });
    qa.suite('E-commerce\\tAuthentication\\tLogin');

    await qa.step('Open login page', async () => {
      await LoginPage.open();
      await expect(LoginPage.usernameInput).toBeDisplayed();
    });

    await qa.step('Login', async (step) => {
      await step.step('Fill credentials', async () => {
        await LoginPage.login('standard_user', 'secret_sauce');
      });
    });
  });
});
```

Prefer **Jira issue keys in test titles**. Use **`await qa.step()`** for step timelines (including nested `step.step()`).

`qa.attach({ type: 'text/plain', ... })` uploads via Forge when content/path is set (still-image / small files). Use **`type`**, not `contentType`.

## Run

```bash
AI_TESTING_TOOL_MODE=off npx wdio run wdio.conf.js
AI_TESTING_TOOL_MODE=off npx wdio run wdio.cucumber.conf.js
```
