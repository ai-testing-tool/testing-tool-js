const QaWdioReporter = require('@ai-testing-tool/forge-wdio').default;
const { afterRunHook, beforeRunHook, QaWdioService } = require('@ai-testing-tool/forge-wdio');

/**
 * FR135 — WebdriverIO + Cucumber/Gherkin (`useCucumber: true`).
 *
 *   npm i -D @wdio/cucumber-framework
 *   AI_TESTING_TOOL_MODE=off npx wdio run ./wdio.cucumber.conf.js
 */
exports.config = {
  runner: 'local',
  specs: ['./test/features/**/*.feature'],
  maxInstances: 1,
  capabilities: [
    {
      browserName: 'chrome',
      'goog:chromeOptions': {
        args: [
          '--headless=new',
          '--disable-gpu',
          '--no-sandbox',
          '--disable-dev-shm-usage',
          '--window-size=1280,800',
        ],
      },
    },
  ],
  logLevel: 'warn',
  baseUrl: 'https://www.saucedemo.com',
  waitforTimeout: 10000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3,
  reporters: [
    'spec',
    [
      QaWdioReporter,
      {
        useCucumber: true,
        disableWebdriverStepsReporting: true,
        disableWebdriverScreenshotsReporting: true,
      },
    ],
  ],
  services: [[QaWdioService, {}]],
  framework: 'cucumber',
  cucumberOpts: {
    require: ['./test/step-definitions/**/*.js'],
    timeout: 60000,
  },
  onPrepare: async function () {
    await beforeRunHook();
  },
  onComplete: async function () {
    await afterRunHook();
  },
};
