import { defineConfig } from 'vitest/config';

/**
 * Default: native reporters only (Path A — JSON + @qanalyzer/forge-api-client).
 * Optional Path B: add `@qanalyzer/forge-vitest` to `reporters` — see README.
 */
export default defineConfig({
  test: {
    watch: false,
    testTimeout: 15_000,
    reporters: ['default'],
  },
});
