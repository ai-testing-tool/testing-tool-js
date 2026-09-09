import {
  frameworkLabel,
  frameworkTestCommand,
  uploadCliCommand,
} from '../frameworks/upload';
import {
  assertReporterFramework,
  frameworkReporterRun,
  planCiVariableHints,
  versionTagCiVariableHints,
  reporterConfigHint,
  reporterFrameworkLabel,
  reporterIngestEnvLines,
  reporterPackageName,
  reporterPreRunScripts,
} from '../frameworks/reporter';
import type {
  CiSecretHint,
  CiTemplateContext,
  CiTemplateResult,
  CiVariableHint,
} from '../types';
import { UnsupportedVariantError } from '../types';

function githubPreRunSteps(ctx: CiTemplateContext): string {
  return reporterPreRunScripts(ctx)
    .map((cmd) => `      - run: ${cmd}`)
    .join('\n');
}

function githubSecrets(): CiSecretHint[] {
  return [
    {
      name: 'AI_TESTING_TOOL_INGEST_URL',
      description:
        'Forge web trigger URL (launch ingest + binary attach / screenshots / qa.attach)',
      platformHint: 'Repository → Settings → Secrets and variables → Actions → New repository secret',
    },
    {
      name: 'AI_TESTING_TOOL_INGEST_TOKEN',
      description: 'Bearer token from AiTestingTool configure page (shown once)',
      platformHint: 'Repository → Settings → Secrets and variables → Actions → New repository secret',
    },
  ];
}

function githubVariables(): CiVariableHint[] {
  return [
    {
      name: 'JIRA_PROJECT_KEY',
      description: 'Jira project key allowlisted in AiTestingTool (e.g. AUTH)',
      platformHint: 'Repository → Settings → Secrets and variables → Actions → Variables',
    },
  ];
}

function githubFilename(framework: CiTemplateContext['framework'], ingestPath: CiTemplateContext['ingestPath']): string {
  const suffix = ingestPath === 'reporter' ? '-reporter' : '';
  return `.github/workflows/ai-testing-tool-${framework}${suffix}.yml`;
}

function renderGithubReporter(ctx: CiTemplateContext): CiTemplateResult {
  assertReporterFramework(ctx);
  const nodeVersion = ctx.nodeVersion ?? '22';
  const env = reporterIngestEnvLines(ctx);
  const urlExpr = ctx.ingestUrlExpr ?? `\${{ secrets.${ctx.ingestUrlSecret} }}`;
  const tokenExpr = ctx.ingestTokenExpr ?? `\${{ secrets.${ctx.ingestTokenSecret} }}`;
  const projectExpr = ctx.projectKeyExpr ?? `\${{ vars.JIRA_PROJECT_KEY }}`;
  const label = reporterFrameworkLabel(ctx);
  const pkg = reporterPackageName(ctx);
  const configHint = reporterConfigHint(ctx);
  const preRun = githubPreRunSteps(ctx);

  const content = `name: AiTestingTool ${label} (${pkg})

# Requires ${pkg} in package.json and ${configHint}
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
${preRun ? `${preRun}\n` : ''}      - name: Run ${label} with AiTestingTool reporter
        env:
          AI_TESTING_TOOL_MODE: ${env.mode}
          AI_TESTING_TOOL_INGEST_URL: ${urlExpr}
          AI_TESTING_TOOL_INGEST_TOKEN: ${tokenExpr}
          AI_TESTING_TOOL_PROJECT_KEY: ${projectExpr}
          AI_TESTING_TOOL_LAUNCH_NAME: \${{ github.workflow }} #\${{ github.run_number }}
          # Optional Test Plan (FR158): AI_TESTING_TOOL_PLAN_NAME / AI_TESTING_TOOL_PLAN_ID / AI_TESTING_TOOL_PLAN_KEY
          # AI_TESTING_TOOL_PLAN_NAME: Smoke
          # Optional tags (FR21): AI_TESTING_TOOL_FIX_VERSION / AI_TESTING_TOOL_SPRINT
          # AI_TESTING_TOOL_FIX_VERSION: 2.4.0
          # AI_TESTING_TOOL_SPRINT: Sprint 42
        run: ${frameworkReporterRun(ctx)}
`;

  return {
    platform: 'github',
    framework: ctx.framework,
    ingestPath: 'reporter',
    filename: githubFilename(ctx.framework, 'reporter'),
    content,
    secretsSetup: githubSecrets(),
    variablesSetup: [...githubVariables(), ...planCiVariableHints(), ...versionTagCiVariableHints()],
  };
}

/**
 * GitHub Actions — upload (Vitest/Jest/Playwright) or reporter
 * (@ai-testing-tool/forge-vitest / @ai-testing-tool/forge-jest / @ai-testing-tool/forge-mocha / @ai-testing-tool/forge-cucumberjs / @ai-testing-tool/forge-cypress / @ai-testing-tool/forge-playwright / @ai-testing-tool/forge-wdio).
 */
export function renderGithubUpload(ctx: CiTemplateContext): CiTemplateResult {
  if (ctx.ingestPath === 'reporter') {
    return renderGithubReporter(ctx);
  }
  if (ctx.ingestPath !== 'upload') {
    throw new UnsupportedVariantError(ctx.platform, ctx.framework, ctx.ingestPath);
  }
  if (
    ctx.framework === 'mocha' ||
    ctx.framework === 'cucumberjs' ||
    ctx.framework === 'cypress' ||
    ctx.framework === 'wdio'
  ) {
    throw new UnsupportedVariantError(ctx.platform, ctx.framework, ctx.ingestPath);
  }

  const nodeVersion = ctx.nodeVersion ?? '22';
  const testCmd = frameworkTestCommand(ctx);
  const uploadCmd = uploadCliCommand(ctx);
  const urlExpr = ctx.ingestUrlExpr ?? `\${{ secrets.${ctx.ingestUrlSecret} }}`;
  const tokenExpr = ctx.ingestTokenExpr ?? `\${{ secrets.${ctx.ingestTokenSecret} }}`;
  const label = frameworkLabel(ctx);
  const preRun = githubPreRunSteps(ctx);

  const testStep =
    ctx.includeTestStep === false
      ? ''
      : `      - run: ${testCmd}\n`;

  const uploadStep =
    ctx.includeUploadStep === false
      ? ''
      : `      - name: Upload to AiTestingTool
        if: always()
        env:
          AI_TESTING_TOOL_INGEST_URL: ${urlExpr}
          AI_TESTING_TOOL_INGEST_TOKEN: ${tokenExpr}
        run: |
          ${uploadCmd.split('\n').join('\n          ')}
`;

  const content = `name: AiTestingTool ${label}

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
${preRun ? `${preRun}\n` : ''}${testStep}${uploadStep}`;

  return {
    platform: 'github',
    framework: ctx.framework,
    ingestPath: 'upload',
    filename: githubFilename(ctx.framework, 'upload'),
    content,
    secretsSetup: githubSecrets(),
    variablesSetup: [...githubVariables(), ...planCiVariableHints(), ...versionTagCiVariableHints()],
  };
}
