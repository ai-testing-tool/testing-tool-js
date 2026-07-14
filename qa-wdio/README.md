# qa-wdio

WebdriverIO reporter + service for **QAnalyzer** (Jira Forge quality hub).

Supports **WebdriverIO 8+** with **Mocha** (`@wdio/mocha-framework`) or **Cucumber** (`@wdio/cucumber-framework`, FR135).

## Install

```bash
# Mocha (default)
npm install -D qa-wdio qa-javascript-commons @wdio/mocha-framework

# Cucumber
npm install -D qa-wdio qa-javascript-commons @wdio/cucumber-framework
```

## Configure — Mocha

```js
// wdio.conf.js
const QaWdioReporter = require('qa-wdio').default;
const { beforeRunHook, afterRunHook, QaWdioService } = require('qa-wdio');

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
        disableWebdriverStepsReporting: true, // FR127 default
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

## Configure — Cucumber (FR135)

```js
// wdio.cucumber.conf.js
const QaWdioReporter = require('qa-wdio').default;
const { beforeRunHook, afterRunHook, QaWdioService } = require('qa-wdio');

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
        useCucumber: true, // scenario → FR41 result; Gherkin steps → meta.qa.steps
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
- Optional metadata: `@suite=Checkout`, `@title=…`, `@tags=smoke,e2e`

See `examples/single/wdio/wdio.cucumber.conf.js`.

**Required for ingest/file:** `onPrepare` → `beforeRunHook` and `onComplete` → `afterRunHook` (NFR33).

### Modes

| Mode | Behavior |
| ---- | -------- |
| `off` (default) | No network / file write |
| `file` | Writes FR41 ingest payload (default `./qanalyzer-results.json`) |
| `ingest` | POSTs FR41 with `format: jest-json` |

Env: `QANALYZER_MODE`, `QANALYZER_PROJECT_KEY`, `QANALYZER_INGEST_URL`, `QANALYZER_INGEST_TOKEN`, `QANALYZER_LAUNCH_NAME`.

## Helpers (Mocha)

```js
const { qa } = require('qa-wdio');
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

Prefer **Jira issue keys in test titles** (FR43). Use **`await qa.step()`** for step timelines (including nested `step.step()`).

`qa.attach({ type: 'text/plain', ... })` uploads via Forge when content/path is set (still-image / small files). Use **`type`**, not `contentType`.

## Run

```bash
QANALYZER_MODE=off npx wdio run wdio.conf.js
QANALYZER_MODE=off npx wdio run wdio.cucumber.conf.js
```
