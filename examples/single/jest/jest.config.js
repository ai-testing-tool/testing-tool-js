/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  testTimeout: 15_000,
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.test.js'],
  reporters: [
    'default',
    [
      '@ai-testing-tool/forge-jest',
      {
        // mode defaults to off — no credentials needed for local runs
        // Override with AI_TESTING_TOOL_MODE=file|ingest
        // projectKey: 'AUTH',
      },
    ],
  ],
};
