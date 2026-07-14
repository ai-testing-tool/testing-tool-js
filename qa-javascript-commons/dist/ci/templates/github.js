"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderGithubUpload = renderGithubUpload;
const upload_1 = require("../frameworks/upload");
const reporter_1 = require("../frameworks/reporter");
const types_1 = require("../types");
function githubPreRunSteps(ctx) {
    return (0, reporter_1.reporterPreRunScripts)(ctx)
        .map((cmd) => `      - run: ${cmd}`)
        .join('\n');
}
function githubSecrets() {
    return [
        {
            name: 'QANALYZER_INGEST_URL',
            description: 'Forge web trigger URL (launch ingest + binary attach / screenshots / qa.attach)',
            platformHint: 'Repository → Settings → Secrets and variables → Actions → New repository secret',
        },
        {
            name: 'QANALYZER_INGEST_TOKEN',
            description: 'Bearer token from QAnalyzer configure page (shown once)',
            platformHint: 'Repository → Settings → Secrets and variables → Actions → New repository secret',
        },
    ];
}
function githubVariables() {
    return [
        {
            name: 'JIRA_PROJECT_KEY',
            description: 'Jira project key allowlisted in QAnalyzer (e.g. AUTH)',
            platformHint: 'Repository → Settings → Secrets and variables → Actions → Variables',
        },
    ];
}
function githubFilename(framework, ingestPath) {
    const suffix = ingestPath === 'reporter' ? '-reporter' : '';
    return `.github/workflows/qanalyzer-${framework}${suffix}.yml`;
}
function renderGithubReporter(ctx) {
    (0, reporter_1.assertReporterFramework)(ctx);
    const nodeVersion = ctx.nodeVersion ?? '22';
    const env = (0, reporter_1.reporterIngestEnvLines)(ctx);
    const urlExpr = ctx.ingestUrlExpr ?? `\${{ secrets.${ctx.ingestUrlSecret} }}`;
    const tokenExpr = ctx.ingestTokenExpr ?? `\${{ secrets.${ctx.ingestTokenSecret} }}`;
    const projectExpr = ctx.projectKeyExpr ?? `\${{ vars.JIRA_PROJECT_KEY }}`;
    const label = (0, reporter_1.reporterFrameworkLabel)(ctx);
    const pkg = (0, reporter_1.reporterPackageName)(ctx);
    const configHint = (0, reporter_1.reporterConfigHint)(ctx);
    const preRun = githubPreRunSteps(ctx);
    const content = `name: QAnalyzer ${label} (${pkg})

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
${preRun ? `${preRun}\n` : ''}      - name: Run ${label} with QAnalyzer reporter
        env:
          QANALYZER_MODE: ${env.mode}
          QANALYZER_INGEST_URL: ${urlExpr}
          QANALYZER_INGEST_TOKEN: ${tokenExpr}
          QANALYZER_PROJECT_KEY: ${projectExpr}
          QANALYZER_LAUNCH_NAME: \${{ github.workflow }} #\${{ github.run_number }}
          # Optional Test Plan (FR158): QANALYZER_PLAN_NAME / QANALYZER_PLAN_ID / QANALYZER_PLAN_KEY
          # QANALYZER_PLAN_NAME: Smoke
          # Optional tags (FR21): QANALYZER_FIX_VERSION / QANALYZER_SPRINT
          # QANALYZER_FIX_VERSION: 2.4.0
          # QANALYZER_SPRINT: Sprint 42
        run: ${(0, reporter_1.frameworkReporterRun)(ctx)}
`;
    return {
        platform: 'github',
        framework: ctx.framework,
        ingestPath: 'reporter',
        filename: githubFilename(ctx.framework, 'reporter'),
        content,
        secretsSetup: githubSecrets(),
        variablesSetup: [...githubVariables(), ...(0, reporter_1.planCiVariableHints)(), ...(0, reporter_1.versionTagCiVariableHints)()],
    };
}
/**
 * GitHub Actions — upload (Vitest/Jest/Playwright) or reporter
 * (qa-vitest / qa-jest / qa-mocha / qa-cucumberjs / qa-cypress / qa-playwright / qa-wdio).
 */
function renderGithubUpload(ctx) {
    if (ctx.ingestPath === 'reporter') {
        return renderGithubReporter(ctx);
    }
    if (ctx.ingestPath !== 'upload') {
        throw new types_1.UnsupportedVariantError(ctx.platform, ctx.framework, ctx.ingestPath);
    }
    if (ctx.framework === 'mocha' ||
        ctx.framework === 'cucumberjs' ||
        ctx.framework === 'cypress' ||
        ctx.framework === 'wdio') {
        throw new types_1.UnsupportedVariantError(ctx.platform, ctx.framework, ctx.ingestPath);
    }
    const nodeVersion = ctx.nodeVersion ?? '22';
    const testCmd = (0, upload_1.frameworkTestCommand)(ctx);
    const uploadCmd = (0, upload_1.uploadCliCommand)(ctx);
    const urlExpr = ctx.ingestUrlExpr ?? `\${{ secrets.${ctx.ingestUrlSecret} }}`;
    const tokenExpr = ctx.ingestTokenExpr ?? `\${{ secrets.${ctx.ingestTokenSecret} }}`;
    const label = (0, upload_1.frameworkLabel)(ctx);
    const preRun = githubPreRunSteps(ctx);
    const testStep = ctx.includeTestStep === false
        ? ''
        : `      - run: ${testCmd}\n`;
    const uploadStep = ctx.includeUploadStep === false
        ? ''
        : `      - name: Upload to QAnalyzer
        if: always()
        env:
          QANALYZER_INGEST_URL: ${urlExpr}
          QANALYZER_INGEST_TOKEN: ${tokenExpr}
        run: |
          ${uploadCmd.split('\n').join('\n          ')}
`;
    const content = `name: QAnalyzer ${label}

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
        variablesSetup: [...githubVariables(), ...(0, reporter_1.planCiVariableHints)(), ...(0, reporter_1.versionTagCiVariableHints)()],
    };
}
