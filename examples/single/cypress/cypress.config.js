const { defineConfig } = require('cypress');

module.exports = defineConfig({
  reporter: './cypress-multi-reporters.js',
  reporterOptions: {
    reporterEnabled: '@ai-testing-tool/forge-cypress',
    qaCypressReporterOptions: {
      // Defaults to mode=off (no credentials). Override with AI_TESTING_TOOL_MODE.
      // mode: 'off' | 'file' | 'ingest',
      // projectKey: 'AUTH',
    },
  },
  video: false,
  screenshotOnRunFailure: false,
  e2e: {
    baseUrl: 'https://www.saucedemo.com',
    setupNodeEvents(on, config) {
      require('@ai-testing-tool/forge-cypress/plugin')(on, config);
      require('@ai-testing-tool/forge-cypress/metadata')(on);
      return config;
    },
  },
});
