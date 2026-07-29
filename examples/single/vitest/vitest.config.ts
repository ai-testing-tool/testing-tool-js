import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

const configDir = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.resolve(configDir, '../../..');
const setupFile = path.join(configDir, 'vitest.setup.ts');
const qaTestHelper = path.join(configDir, 'qa-test.ts');

export const workspacePackages = [
  'qa-javascript-commons',
  'qa-forge-api-client',
  'qa-cucumberjs',
  'qa-cypress',
  'qa-jest',
  'qa-mocha',
  'qa-playwright',
  'qa-vitest',
  'qa-wdio',
] as const;

export const testProjects = [
  { name: 'pilot', root: 'examples/single/vitest', include: 'test/**/*.test.ts' },
  ...workspacePackages.map((pkg) => ({
    name: pkg,
    root: pkg,
    include: 'src/__tests__/**/*.test.ts',
  })),
] as const;

export const projectRoots: Record<string, string> = Object.fromEntries(
  testProjects.map((p) => [p.name, p.root]),
);

const issuePrefixByProject: Record<string, string> = {
  pilot: 'AUTH-1',
  'qa-javascript-commons': 'AUTH-2',
  'qa-forge-api-client': 'AUTH-3',
  'qa-cucumberjs': 'AUTH-4',
  'qa-cypress': 'AUTH-5',
  'qa-jest': 'AUTH-6',
  'qa-mocha': 'AUTH-7',
  'qa-playwright': 'AUTH-8',
  'qa-vitest': 'AUTH-9',
  'qa-wdio': 'AUTH-10',
};

function projectConfig(name: string, root: string, include: string) {
  return {
    resolve: {
      alias: {
        '@qa/test': qaTestHelper,
      },
    },
    test: {
      name,
      root: path.join(monorepoRoot, root),
      include: [include],
      setupFiles: [setupFile],
      testTimeout: 15_000,
      exclude: ['**/node_modules/**', '**/dist/**'],
      env: {
        QA_ISSUE_PREFIX: issuePrefixByProject[name] ?? 'AUTH-9',
      },
    },
  };
}

const reportFile =
  process.env.QANALYZER_FILE_PATH ??
  path.join(monorepoRoot, 'qanalyzer-results.json');

export default defineConfig({
  test: {
    reporters: [
      'default',
      [
        '@qanalyzer/forge-vitest',
        {
          mode: 'file',
          projectKey: process.env.QANALYZER_PROJECT_KEY ?? 'AUTH',
          launchName: process.env.QANALYZER_LAUNCH_NAME ?? 'sdk',
          file: { path: reportFile },
        },
      ],
    ],
    projects: testProjects.map((p) => projectConfig(p.name, p.root, p.include)),
  },
});

export { monorepoRoot };
