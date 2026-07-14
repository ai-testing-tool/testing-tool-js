"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderAzureDevOpsUpload = renderAzureDevOpsUpload;
const upload_1 = require("../frameworks/upload");
const reporter_1 = require("../frameworks/reporter");
const types_1 = require("../types");
function azurePreRunScripts(ctx) {
    return (0, reporter_1.reporterPreRunScripts)(ctx)
        .map((cmd) => `  - script: ${cmd}
    displayName: Install Playwright browsers
`)
        .join('');
}
function azureSecrets() {
    return [
        {
            name: 'QANALYZER_INGEST_URL',
            description: 'Forge web trigger URL (launch ingest + binary attach / screenshots / qa.attach)',
            platformHint: 'Pipelines → Library → Variable group `qanalyzer-secrets` (mark as secret)',
        },
        {
            name: 'QANALYZER_INGEST_TOKEN',
            description: 'Bearer token from QAnalyzer configure page (shown once)',
            platformHint: 'Pipelines → Library → Variable group `qanalyzer-secrets` (mark as secret)',
        },
    ];
}
function azureVariables() {
    return [
        {
            name: 'JiraProjectKey',
            description: 'Jira project key allowlisted in QAnalyzer (e.g. AUTH)',
            platformHint: 'Pipeline variable or entry in variable group `qanalyzer-secrets`',
        },
    ];
}
function renderAzureReporter(ctx) {
    (0, reporter_1.assertReporterFramework)(ctx);
    const nodeVersion = ctx.nodeVersion ?? '22';
    const urlExpr = ctx.ingestUrlExpr ?? `$(${ctx.ingestUrlSecret})`;
    const tokenExpr = ctx.ingestTokenExpr ?? `$(${ctx.ingestTokenSecret})`;
    const label = (0, reporter_1.reporterFrameworkLabel)(ctx);
    const pkg = (0, reporter_1.reporterPackageName)(ctx);
    const configHint = (0, reporter_1.reporterConfigHint)(ctx);
    const content = `# QAnalyzer fragment — ${label} ${pkg} reporter path
# Requires ${pkg} in package.json and ${configHint}
trigger:
  - main

pool:
  vmImage: ubuntu-latest

variables:
  - group: qanalyzer-secrets
  - name: JiraProjectKey
    value: ${ctx.projectKey}

steps:
  - task: NodeTool@0
    inputs:
      versionSpec: '${nodeVersion}.x'
    displayName: Use Node.js ${nodeVersion}

  - script: npm ci
    displayName: Install dependencies

${azurePreRunScripts(ctx)}  - script: ${(0, reporter_1.frameworkReporterRun)(ctx)}
    displayName: Run ${label} with QAnalyzer reporter
    env:
      QANALYZER_MODE: ingest
      QANALYZER_INGEST_URL: ${urlExpr}
      QANALYZER_INGEST_TOKEN: ${tokenExpr}
      QANALYZER_PROJECT_KEY: $(JiraProjectKey)
`;
    return {
        platform: 'azure-devops',
        framework: ctx.framework,
        ingestPath: 'reporter',
        filename: 'azure-pipelines.yml',
        content,
        secretsSetup: azureSecrets(),
        variablesSetup: [...azureVariables(), ...(0, reporter_1.planCiVariableHints)(), ...(0, reporter_1.versionTagCiVariableHints)()],
    };
}
/**
 * Azure DevOps — upload path or qa-vitest / qa-jest reporter path.
 */
function renderAzureDevOpsUpload(ctx) {
    if (ctx.ingestPath === 'reporter') {
        return renderAzureReporter(ctx);
    }
    if (ctx.ingestPath !== 'upload') {
        throw new types_1.UnsupportedVariantError(ctx.platform, ctx.framework, ctx.ingestPath);
    }
    const nodeVersion = ctx.nodeVersion ?? '22';
    const testCmd = (0, upload_1.frameworkTestCommand)(ctx);
    const label = (0, upload_1.frameworkLabel)(ctx);
    const uploadBlock = (0, upload_1.indentUploadCli)(ctx, 6);
    const urlExpr = ctx.ingestUrlExpr ?? `$(${ctx.ingestUrlSecret})`;
    const tokenExpr = ctx.ingestTokenExpr ?? `$(${ctx.ingestTokenSecret})`;
    const content = `# QAnalyzer fragment — ${label} upload path
trigger:
  - main

pool:
  vmImage: ubuntu-latest

variables:
  - group: qanalyzer-secrets   # QANALYZER_INGEST_URL, QANALYZER_INGEST_TOKEN
  - name: JiraProjectKey
    value: ${ctx.projectKey}

steps:
  - task: NodeTool@0
    inputs:
      versionSpec: '${nodeVersion}.x'
    displayName: Use Node.js ${nodeVersion}

  - script: npm ci
    displayName: Install dependencies

${azurePreRunScripts(ctx)}  - script: ${testCmd}
    displayName: Run ${label}

  - script: |
${uploadBlock}
    displayName: Upload to QAnalyzer
    condition: always()
    env:
      QANALYZER_INGEST_URL: ${urlExpr}
      QANALYZER_INGEST_TOKEN: ${tokenExpr}
`;
    return {
        platform: 'azure-devops',
        framework: ctx.framework,
        ingestPath: 'upload',
        filename: 'azure-pipelines.yml',
        content,
        secretsSetup: azureSecrets(),
        variablesSetup: [...azureVariables(), ...(0, reporter_1.planCiVariableHints)(), ...(0, reporter_1.versionTagCiVariableHints)()],
    };
}
