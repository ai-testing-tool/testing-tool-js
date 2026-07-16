const { defineConfig } = require('cypress');

module.exports = defineConfig({
  reporter: './cypress-multi-reporters.js',
  reporterOptions: {
    reporterEnabled: '@qanalyzer/forge-cypress',
    qaCypressReporterOptions: {
      // Defaults to mode=off (no credentials). Override with QANALYZER_MODE.
      // mode: 'off' | 'file' | 'ingest',
      // projectKey: 'AUTH',
    },
  },
  video: false,
  screenshotOnRunFailure: false,
  e2e: {
    baseUrl: 'https://www.saucedemo.com',
    setupNodeEvents(on, config) {
      require('@qanalyzer/forge-cypress/plugin')(on, config);
      require('@qanalyzer/forge-cypress/metadata')(on);
      return config;
    },
  },
});
