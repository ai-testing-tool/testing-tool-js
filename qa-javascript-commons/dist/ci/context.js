"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCiTemplateContext = buildCiTemplateContext;
const DEFAULT_NODE = '22';
const DEFAULT_REPORT = 'qanalyzer-results.json';
const DEFAULT_URL_SECRET = 'QANALYZER_INGEST_URL';
const DEFAULT_TOKEN_SECRET = 'QANALYZER_INGEST_TOKEN';
const PLATFORM_DEFAULTS = {
    github: {
        projectKeyExpr: () => '${{ vars.JIRA_PROJECT_KEY }}',
        ingestUrlExpr: (name) => `\${{ secrets.${name} }}`,
        ingestTokenExpr: (name) => `\${{ secrets.${name} }}`,
        launchNameExpr: '${{ github.workflow }} #${{ github.run_number }}',
        alwaysGuard: 'if: always()',
    },
    gitlab: {
        projectKeyExpr: () => '$JIRA_PROJECT_KEY',
        ingestUrlExpr: (name) => `$${name}`,
        ingestTokenExpr: (name) => `$${name}`,
        launchNameExpr: '$CI_PIPELINE_ID',
        alwaysGuard: 'when: always',
    },
    'azure-devops': {
        projectKeyExpr: () => '$(JiraProjectKey)',
        ingestUrlExpr: (name) => `$(${name})`,
        ingestTokenExpr: (name) => `$(${name})`,
        launchNameExpr: '$(Build.DefinitionName) #$(Build.BuildNumber)',
        alwaysGuard: 'condition: always()',
    },
    jenkins: {
        projectKeyExpr: () => '${JIRA_PROJECT_KEY}',
        ingestUrlExpr: () => "credentials('qanalyzer-ingest-url')",
        ingestTokenExpr: () => "credentials('qanalyzer-ingest-token')",
        launchNameExpr: '${JOB_NAME} #${BUILD_NUMBER}',
        alwaysGuard: 'post { always { … } }',
    },
    bitbucket: {
        projectKeyExpr: () => '$JIRA_PROJECT_KEY',
        ingestUrlExpr: (name) => `$${name}`,
        ingestTokenExpr: (name) => `$${name}`,
        launchNameExpr: 'build-$BITBUCKET_BUILD_NUMBER',
        alwaysGuard: 'after-script',
    },
};
/**
 * Fills platform-specific expression defaults (proposal §3.2).
 * Does not embed token values — only secret *names* and expressions.
 */
function buildCiTemplateContext(partial) {
    const ingestUrlSecret = partial.ingestUrlSecret ?? DEFAULT_URL_SECRET;
    const ingestTokenSecret = partial.ingestTokenSecret ?? DEFAULT_TOKEN_SECRET;
    const defaults = PLATFORM_DEFAULTS[partial.platform];
    return {
        platform: partial.platform,
        framework: partial.framework,
        ingestPath: partial.ingestPath,
        projectKey: partial.projectKey,
        ingestUrl: partial.ingestUrl,
        ingestUrlSecret,
        ingestTokenSecret,
        nodeVersion: partial.nodeVersion ?? DEFAULT_NODE,
        reportFile: partial.reportFile ?? DEFAULT_REPORT,
        projectKeyExpr: partial.projectKeyExpr ?? defaults.projectKeyExpr(partial.projectKey),
        launchNameExpr: partial.launchNameExpr ?? defaults.launchNameExpr,
        ingestUrlExpr: partial.ingestUrlExpr ?? defaults.ingestUrlExpr(ingestUrlSecret),
        ingestTokenExpr: partial.ingestTokenExpr ?? defaults.ingestTokenExpr(ingestTokenSecret),
        alwaysGuard: partial.alwaysGuard ?? defaults.alwaysGuard,
        includeTestStep: partial.includeTestStep ?? true,
        includeUploadStep: partial.includeUploadStep ?? partial.ingestPath === 'upload',
    };
}
