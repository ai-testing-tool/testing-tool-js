"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderGitlabUpload = renderGitlabUpload;
const upload_1 = require("../frameworks/upload");
const reporter_1 = require("../frameworks/reporter");
const types_1 = require("../types");
function gitlabSecrets() {
    return [
        {
            name: 'QANALYZER_INGEST_URL',
            description: 'Forge web trigger URL for QAnalyzer ingest',
            platformHint: 'Settings → CI/CD → Variables → Add variable (Masked + Protected as needed)',
        },
        {
            name: 'QANALYZER_INGEST_TOKEN',
            description: 'Bearer token from QAnalyzer configure page (shown once)',
            platformHint: 'Settings → CI/CD → Variables → Add variable (Masked + Protected)',
        },
    ];
}
function gitlabVariables() {
    return [
        {
            name: 'JIRA_PROJECT_KEY',
            description: 'Jira project key allowlisted in QAnalyzer (e.g. AUTH)',
            platformHint: 'Settings → CI/CD → Variables',
        },
    ];
}
function renderGitlabReporter(ctx) {
    (0, reporter_1.assertVitestReporter)(ctx);
    const nodeVersion = ctx.nodeVersion ?? '22';
    const content = `# QAnalyzer fragment — Vitest qa-vitest reporter path
# Requires qa-vitest in package.json and vitest.config.ts reporters
stages:
  - test

vitest:
  stage: test
  image: node:${nodeVersion}-alpine
  variables:
    QANALYZER_MODE: ingest
    QANALYZER_INGEST_URL: $QANALYZER_INGEST_URL
    QANALYZER_INGEST_TOKEN: $QANALYZER_INGEST_TOKEN
    QANALYZER_PROJECT_KEY: $JIRA_PROJECT_KEY
    QANALYZER_LAUNCH_NAME: $CI_PIPELINE_ID
  script:
    - npm ci
    - ${(0, reporter_1.vitestReporterRun)()}
`;
    return {
        platform: 'gitlab',
        framework: 'vitest',
        ingestPath: 'reporter',
        filename: '.gitlab-ci.yml',
        content,
        secretsSetup: gitlabSecrets(),
        variablesSetup: gitlabVariables(),
    };
}
/**
 * GitLab CI — upload path or Vitest reporter path.
 */
function renderGitlabUpload(ctx) {
    if (ctx.ingestPath === 'reporter') {
        return renderGitlabReporter(ctx);
    }
    if (ctx.ingestPath !== 'upload') {
        throw new types_1.UnsupportedVariantError(ctx.platform, ctx.framework, ctx.ingestPath);
    }
    const nodeVersion = ctx.nodeVersion ?? '22';
    const reportFile = ctx.reportFile ?? 'qanalyzer-results.json';
    const testCmd = (0, upload_1.frameworkTestCommand)(ctx);
    const jobName = ctx.framework;
    const label = (0, upload_1.frameworkLabel)(ctx);
    const uploadBlock = (0, upload_1.indentUploadCli)(ctx, 6);
    const content = `# QAnalyzer fragment — merge into your .gitlab-ci.yml
# ${label} upload path
stages:
  - test
  - report

${jobName}:
  stage: test
  image: node:${nodeVersion}-alpine
  script:
    - npm ci
    - ${testCmd}
  artifacts:
    when: always
    paths:
      - ${reportFile}

qanalyzer_upload:
  stage: report
  image: node:${nodeVersion}-alpine
  when: always
  needs: [${jobName}]
  variables:
    QANALYZER_INGEST_URL: $QANALYZER_INGEST_URL
    QANALYZER_INGEST_TOKEN: $QANALYZER_INGEST_TOKEN
  script:
    - |
${uploadBlock}
`;
    return {
        platform: 'gitlab',
        framework: ctx.framework,
        ingestPath: 'upload',
        filename: '.gitlab-ci.yml',
        content,
        secretsSetup: gitlabSecrets(),
        variablesSetup: gitlabVariables(),
    };
}
