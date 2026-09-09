import type { CiPlatform, CiTemplateContext, CiTemplatePartial } from './types';

const DEFAULT_NODE = '22';
const DEFAULT_REPORT = 'ai-testing-tool-results.json';
const DEFAULT_URL_SECRET = 'AI_TESTING_TOOL_INGEST_URL';
const DEFAULT_TOKEN_SECRET = 'AI_TESTING_TOOL_INGEST_TOKEN';

interface PlatformDefaults {
  projectKeyExpr: (projectKey: string) => string;
  ingestUrlExpr: (secretName: string) => string;
  ingestTokenExpr: (secretName: string) => string;
  launchNameExpr: string;
  alwaysGuard: string;
}

const PLATFORM_DEFAULTS: Record<CiPlatform, PlatformDefaults> = {
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
    ingestUrlExpr: () => "credentials('ai-testing-tool-ingest-url')",
    ingestTokenExpr: () => "credentials('ai-testing-tool-ingest-token')",
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
export function buildCiTemplateContext(partial: CiTemplatePartial): CiTemplateContext {
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
