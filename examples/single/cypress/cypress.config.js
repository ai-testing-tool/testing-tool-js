const { defineConfig } = require('cypress');

module.exports = defineConfig({
  reporter: './cypress-multi-reporters.js',
  reporterOptions: {
    reporterEnabled: 'qa-forge-cypress',
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
      require('qa-forge-cypress/plugin')(on, config);
      require('qa-forge-cypress/metadata')(on);
      return config;
    },
  },
});
