/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  testTimeout: 15_000,
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.json',
      },
    ],
  },
  // Default: native reporters only (Path A — JSON + @ai-testing-tool/forge-api-client).
  // Optional Path B: add `@ai-testing-tool/forge-jest` to `reporters` — see README.
  reporters: ['default'],
};
