const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  timeout: 30_000,
  testDir: './test',
  testMatch: /.*\.spec\.js/,
  use: {
    baseURL: 'https://www.saucedemo.com',
    screenshot: 'off',
    video: 'off',
  },
  reporter: [
    ['list'],
    [
      '@qanalyzer/forge-playwright',
      {
        // Defaults to mode=off (no credentials). Override with QANALYZER_MODE.
        // mode: 'off' | 'file' | 'ingest',
        // projectKey: 'AUTH',
      },
    ],
  ],
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
});
