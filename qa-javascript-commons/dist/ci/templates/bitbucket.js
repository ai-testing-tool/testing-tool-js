"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderBitbucketUpload = renderBitbucketUpload;
const upload_1 = require("../frameworks/upload");
const reporter_1 = require("../frameworks/reporter");
const types_1 = require("../types");
function bitbucketSecrets() {
    return [
        {
            name: 'QANALYZER_INGEST_URL',
            description: 'Forge web trigger URL for QAnalyzer ingest',
            platformHint: 'Repository settings → Pipelines → Repository variables (Secured)',
        },
        {
            name: 'QANALYZER_INGEST_TOKEN',
            description: 'Bearer token from QAnalyzer configure page (shown once)',
            platformHint: 'Repository settings → Pipelines → Repository variables (Secured)',
        },
    ];
}
function bitbucketVariables() {
    return [
        {
            name: 'JIRA_PROJECT_KEY',
            description: 'Jira project key allowlisted in QAnalyzer (e.g. AUTH)',
            platformHint: 'Repository settings → Pipelines → Repository variables',
        },
    ];
}
function renderBitbucketReporter(ctx) {
    (0, reporter_1.assertVitestReporter)(ctx);
    const nodeVersion = ctx.nodeVersion ?? '22';
    const content = `# QAnalyzer fragment — Vitest qa-vitest reporter path
# Set secured vars QANALYZER_INGEST_URL / QANALYZER_INGEST_TOKEN
image: node:${nodeVersion}

pipelines:
  default:
    - step:
        name: Test with QAnalyzer
        caches:
          - node
        script:
          - export QANALYZER_MODE=ingest
          - export QANALYZER_PROJECT_KEY=$JIRA_PROJECT_KEY
          - npm ci
          - ${(0, reporter_1.vitestReporterRun)()}
`;
    return {
        platform: 'bitbucket',
        framework: 'vitest',
        ingestPath: 'reporter',
        filename: 'bitbucket-pipelines.yml',
        content,
        secretsSetup: bitbucketSecrets(),
        variablesSetup: bitbucketVariables(),
    };
}
/**
 * Bitbucket Pipelines — upload path or Vitest reporter path.
 */
function renderBitbucketUpload(ctx) {
    if (ctx.ingestPath === 'reporter') {
        return renderBitbucketReporter(ctx);
    }
    if (ctx.ingestPath !== 'upload') {
        throw new types_1.UnsupportedVariantError(ctx.platform, ctx.framework, ctx.ingestPath);
    }
    const nodeVersion = ctx.nodeVersion ?? '22';
    const reportFile = ctx.reportFile ?? 'qanalyzer-results.json';
    const testCmd = (0, upload_1.frameworkTestCommand)(ctx);
    const label = (0, upload_1.frameworkLabel)(ctx);
    const uploadBlock = (0, upload_1.indentUploadCli)(ctx, 12);
    const content = `# QAnalyzer fragment — merge into your bitbucket-pipelines.yml
# ${label} upload path — set secured vars QANALYZER_INGEST_URL / QANALYZER_INGEST_TOKEN
image: node:${nodeVersion}

pipelines:
  default:
    - step:
        name: Test
        caches:
          - node
        script:
          - npm ci
          - ${testCmd}
        artifacts:
          - ${reportFile}
    - step:
        name: Upload QAnalyzer
        script:
          - |
${uploadBlock}
`;
    return {
        platform: 'bitbucket',
        framework: ctx.framework,
        ingestPath: 'upload',
        filename: 'bitbucket-pipelines.yml',
        content,
        secretsSetup: bitbucketSecrets(),
        variablesSetup: bitbucketVariables(),
    };
}
