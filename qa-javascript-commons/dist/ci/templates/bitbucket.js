"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderBitbucketUpload = renderBitbucketUpload;
const upload_1 = require("../frameworks/upload");
const reporter_1 = require("../frameworks/reporter");
const types_1 = require("../types");
function bitbucketScriptLines(ctx, ...cmds) {
    return [...(0, reporter_1.reporterPreRunScripts)(ctx), ...cmds]
        .map((c) => `          - ${c}`)
        .join('\n');
}
function bitbucketSecrets() {
    return [
        {
            name: 'AI_TESTING_TOOL_INGEST_URL',
            description: 'Forge web trigger URL (launch ingest + binary attach / screenshots / qa.attach)',
            platformHint: 'Repository settings → Pipelines → Repository variables (Secured)',
        },
        {
            name: 'AI_TESTING_TOOL_INGEST_TOKEN',
            description: 'Bearer token from AiTestingTool configure page (shown once)',
            platformHint: 'Repository settings → Pipelines → Repository variables (Secured)',
        },
    ];
}
function bitbucketVariables() {
    return [
        {
            name: 'JIRA_PROJECT_KEY',
            description: 'Jira project key allowlisted in AiTestingTool (e.g. AUTH)',
            platformHint: 'Repository settings → Pipelines → Repository variables',
        },
    ];
}
function renderBitbucketReporter(ctx) {
    (0, reporter_1.assertReporterFramework)(ctx);
    const nodeVersion = ctx.nodeVersion ?? '22';
    const label = (0, reporter_1.reporterFrameworkLabel)(ctx);
    const pkg = (0, reporter_1.reporterPackageName)(ctx);
    const configHint = (0, reporter_1.reporterConfigHint)(ctx);
    const content = `# AiTestingTool fragment — ${label} ${pkg} reporter path
# Requires ${pkg} in package.json and ${configHint}
# Set secured vars AI_TESTING_TOOL_INGEST_URL / AI_TESTING_TOOL_INGEST_TOKEN
image: node:${nodeVersion}

pipelines:
  default:
    - step:
        name: Test with AiTestingTool
        caches:
          - node
        script:
          - export AI_TESTING_TOOL_MODE=ingest
          - export AI_TESTING_TOOL_PROJECT_KEY=$JIRA_PROJECT_KEY
          - npm ci
${bitbucketScriptLines(ctx, (0, reporter_1.frameworkReporterRun)(ctx))}
`;
    return {
        platform: 'bitbucket',
        framework: ctx.framework,
        ingestPath: 'reporter',
        filename: 'bitbucket-pipelines.yml',
        content,
        secretsSetup: bitbucketSecrets(),
        variablesSetup: [...bitbucketVariables(), ...(0, reporter_1.planCiVariableHints)(), ...(0, reporter_1.versionTagCiVariableHints)()],
    };
}
/**
 * Bitbucket Pipelines — upload path or @ai-testing-tool/forge-vitest / @ai-testing-tool/forge-jest reporter path.
 */
function renderBitbucketUpload(ctx) {
    if (ctx.ingestPath === 'reporter') {
        return renderBitbucketReporter(ctx);
    }
    if (ctx.ingestPath !== 'upload') {
        throw new types_1.UnsupportedVariantError(ctx.platform, ctx.framework, ctx.ingestPath);
    }
    const nodeVersion = ctx.nodeVersion ?? '22';
    const reportFile = ctx.reportFile ?? 'ai-testing-tool-results.json';
    const testCmd = (0, upload_1.frameworkTestCommand)(ctx);
    const label = (0, upload_1.frameworkLabel)(ctx);
    const uploadBlock = (0, upload_1.indentUploadCli)(ctx, 12);
    const content = `# AiTestingTool fragment — merge into your bitbucket-pipelines.yml
# ${label} upload path — set secured vars AI_TESTING_TOOL_INGEST_URL / AI_TESTING_TOOL_INGEST_TOKEN
image: node:${nodeVersion}

pipelines:
  default:
    - step:
        name: Test
        caches:
          - node
        script:
          - npm ci
${bitbucketScriptLines(ctx, testCmd)}
        artifacts:
          - ${reportFile}
    - step:
        name: Upload AiTestingTool
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
        variablesSetup: [...bitbucketVariables(), ...(0, reporter_1.planCiVariableHints)(), ...(0, reporter_1.versionTagCiVariableHints)()],
    };
}
