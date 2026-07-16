"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderGitlabUpload = renderGitlabUpload;
const upload_1 = require("../frameworks/upload");
const reporter_1 = require("../frameworks/reporter");
const types_1 = require("../types");
function gitlabScriptLines(ctx, ...cmds) {
    return [...(0, reporter_1.reporterPreRunScripts)(ctx), ...cmds].map((c) => `    - ${c}`).join('\n');
}
function gitlabSecrets() {
    return [
        {
            name: 'QANALYZER_INGEST_URL',
            description: 'Forge web trigger URL (launch ingest + binary attach / screenshots / qa.attach)',
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
    (0, reporter_1.assertReporterFramework)(ctx);
    const nodeVersion = ctx.nodeVersion ?? '22';
    const label = (0, reporter_1.reporterFrameworkLabel)(ctx);
    const pkg = (0, reporter_1.reporterPackageName)(ctx);
    const configHint = (0, reporter_1.reporterConfigHint)(ctx);
    const jobName = ctx.framework;
    const content = `# QAnalyzer fragment — ${label} ${pkg} reporter path
# Requires ${pkg} in package.json and ${configHint}
stages:
  - test

${jobName}:
  stage: test
  image: node:${nodeVersion}-alpine
  variables:
    QANALYZER_MODE: ingest
    QANALYZER_INGEST_URL: $QANALYZER_INGEST_URL
    QANALYZER_INGEST_TOKEN: $QANALYZER_INGEST_TOKEN
    QANALYZER_PROJECT_KEY: $JIRA_PROJECT_KEY
    QANALYZER_LAUNCH_NAME: $CI_PIPELINE_ID
    # Optional Test Plan: QANALYZER_PLAN_NAME / QANALYZER_PLAN_ID / QANALYZER_PLAN_KEY
    # Optional tags: QANALYZER_FIX_VERSION / QANALYZER_SPRINT
  script:
    - npm ci
${gitlabScriptLines(ctx, (0, reporter_1.frameworkReporterRun)(ctx))}
`;
    return {
        platform: 'gitlab',
        framework: ctx.framework,
        ingestPath: 'reporter',
        filename: '.gitlab-ci.yml',
        content,
        secretsSetup: gitlabSecrets(),
        variablesSetup: [...gitlabVariables(), ...(0, reporter_1.planCiVariableHints)(), ...(0, reporter_1.versionTagCiVariableHints)()],
    };
}
/**
 * GitLab CI — upload path or @qanalyzer/forge-vitest / @qanalyzer/forge-jest reporter path.
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
${gitlabScriptLines(ctx, testCmd)}
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
        variablesSetup: [...gitlabVariables(), ...(0, reporter_1.planCiVariableHints)(), ...(0, reporter_1.versionTagCiVariableHints)()],
    };
}
