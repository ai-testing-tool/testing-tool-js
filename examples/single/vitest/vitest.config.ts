import { defineConfig } from 'vitest/config';

/**
 * Default: native reporters only (Path A — JSON + qa-forge-api-client).
 * Optional Path B: add `qa-vitest` to `reporters` — see README.
 */
export default defineConfig({
  test: {
    watch: false,
    testTimeout: 15_000,
    reporters: ['default'],
  },
});
