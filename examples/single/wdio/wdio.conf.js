const QaWdioReporter = require('@qanalyzer/forge-wdio').default;
const { afterRunHook, beforeRunHook, QaWdioService } = require('@qanalyzer/forge-wdio');

exports.config = {
  runner: 'local',
  specs: ['./test/specs/**/*.spec.js'],
  // One browser at a time — saucedemo + ChromeDriver are flaky under parallel load
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
  specFileRetries: 0,
  reporters: [
    'spec',
    [
      QaWdioReporter,
      {
        // Defaults to mode=off via QANALYZER_MODE / commons
        disableWebdriverStepsReporting: true,
        disableWebdriverScreenshotsReporting: true,
      },
    ],
  ],
  services: [[QaWdioService, {}]],
  framework: 'mocha',
  mochaOpts: {
    ui: 'bdd',
    timeout: 60000,
  },
  onPrepare: async function () {
    await beforeRunHook();
  },
  onComplete: async function () {
    await afterRunHook();
  },
};
