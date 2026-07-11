import { frameworkTestCommand, uploadCliCommand } from '../frameworks/upload';
import {
  assertVitestReporter,
  reporterIngestEnvLines,
  vitestReporterRun,
} from '../frameworks/reporter';
import type {
  CiSecretHint,
  CiTemplateContext,
  CiTemplateResult,
  CiVariableHint,
} from '../types';
import { UnsupportedVariantError } from '../types';

function githubSecrets(): CiSecretHint[] {
  return [
    {
      name: 'QANALYZER_INGEST_URL',
      description: 'Forge web trigger URL for QAnalyzer ingest',
      platformHint: 'Repository → Settings → Secrets and variables → Actions → New repository secret',
    },
    {
      name: 'QANALYZER_INGEST_TOKEN',
      description: 'Bearer token from QAnalyzer configure page (shown once)',
      platformHint: 'Repository → Settings → Secrets and variables → Actions → New repository secret',
    },
  ];
}

function githubVariables(): CiVariableHint[] {
  return [
    {
      name: 'JIRA_PROJECT_KEY',
      description: 'Jira project key allowlisted in QAnalyzer (e.g. AUTH)',
      platformHint: 'Repository → Settings → Secrets and variables → Actions → Variables',
    },
  ];
}

function githubFilename(framework: CiTemplateContext['framework'], ingestPath: CiTemplateContext['ingestPath']): string {
  const suffix = ingestPath === 'reporter' ? '-reporter' : '';
  return `.github/workflows/qanalyzer-${framework}${suffix}.yml`;
}

function renderGithubReporter(ctx: CiTemplateContext): CiTemplateResult {
  assertVitestReporter(ctx);
  const nodeVersion = ctx.nodeVersion ?? '22';
  const env = reporterIngestEnvLines(ctx);
  const urlExpr = ctx.ingestUrlExpr ?? `\${{ secrets.${ctx.ingestUrlSecret} }}`;
  const tokenExpr = ctx.ingestTokenExpr ?? `\${{ secrets.${ctx.ingestTokenSecret} }}`;
  const projectExpr = ctx.projectKeyExpr ?? `\${{ vars.JIRA_PROJECT_KEY }}`;

  const content = `name: QAnalyzer Vitest (qa-vitest)

# Requires qa-vitest in package.json and vitest.config.ts reporters: ['default', 'qa-vitest']
on:
  push:
    branches: [main]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "${nodeVersion}"
          cache: npm
      - run: npm ci
      - name: Run Vitest with QAnalyzer reporter
        env:
          QANALYZER_MODE: ${env.mode}
          QANALYZER_INGEST_URL: ${urlExpr}
          QANALYZER_INGEST_TOKEN: ${tokenExpr}
          QANALYZER_PROJECT_KEY: ${projectExpr}
          QANALYZER_LAUNCH_NAME: \${{ github.workflow }} #\${{ github.run_number }}
        run: ${vitestReporterRun()}
`;

  return {
    platform: 'github',
    framework: 'vitest',
    ingestPath: 'reporter',
    filename: githubFilename('vitest', 'reporter'),
    content,
    secretsSetup: githubSecrets(),
    variablesSetup: githubVariables(),
  };
}

/**
 * GitHub Actions — Vitest/Jest upload path, or Vitest qa-vitest reporter path.
 */
export function renderGithubUpload(ctx: CiTemplateContext): CiTemplateResult {
  if (ctx.ingestPath === 'reporter') {
    return renderGithubReporter(ctx);
  }
  if (ctx.ingestPath !== 'upload') {
    throw new UnsupportedVariantError(ctx.platform, ctx.framework, ctx.ingestPath);
  }

  const nodeVersion = ctx.nodeVersion ?? '22';
  const testCmd = frameworkTestCommand(ctx);
  const uploadCmd = uploadCliCommand(ctx);
  const urlExpr = ctx.ingestUrlExpr ?? `\${{ secrets.${ctx.ingestUrlSecret} }}`;
  const tokenExpr = ctx.ingestTokenExpr ?? `\${{ secrets.${ctx.ingestTokenSecret} }}`;

  const testStep =
    ctx.includeTestStep === false
      ? ''
      : `      - run: ${testCmd}\n`;

  const uploadStep =
    ctx.includeUploadStep === false
      ? ''
      : `      - name: Upload to QAnalyzer
        if: always()
        env:
          QANALYZER_INGEST_URL: ${urlExpr}
          QANALYZER_INGEST_TOKEN: ${tokenExpr}
        run: |
          ${uploadCmd.split('\n').join('\n          ')}
`;

  const content = `name: QAnalyzer ${ctx.framework === 'vitest' ? 'Vitest' : 'Jest'}

on:
  push:
    branches: [main]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "${nodeVersion}"
          cache: npm
      - run: npm ci
${testStep}${uploadStep}`;

  return {
    platform: 'github',
    framework: ctx.framework,
    ingestPath: 'upload',
    filename: githubFilename(ctx.framework, 'upload'),
    content,
    secretsSetup: githubSecrets(),
    variablesSetup: githubVariables(),
  };
}
