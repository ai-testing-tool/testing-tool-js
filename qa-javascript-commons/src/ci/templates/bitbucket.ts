import {
  frameworkLabel,
  frameworkTestCommand,
  indentUploadCli,
} from '../frameworks/upload';
import {
  assertReporterFramework,
  frameworkReporterRun,
  reporterConfigHint,
  reporterFrameworkLabel,
  planCiVariableHints,
  versionTagCiVariableHints,
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

function bitbucketScriptLines(ctx: CiTemplateContext, ...cmds: string[]): string {
  return [...reporterPreRunScripts(ctx), ...cmds]
    .map((c) => `          - ${c}`)
    .join('\n');
}

function bitbucketSecrets(): CiSecretHint[] {
  return [
    {
      name: 'QANALYZER_INGEST_URL',
      description:
        'Forge web trigger URL (launch ingest + binary attach / screenshots / qa.attach)',
      platformHint: 'Repository settings → Pipelines → Repository variables (Secured)',
    },
    {
      name: 'QANALYZER_INGEST_TOKEN',
      description: 'Bearer token from QAnalyzer configure page (shown once)',
      platformHint: 'Repository settings → Pipelines → Repository variables (Secured)',
    },
  ];
}

function bitbucketVariables(): CiVariableHint[] {
  return [
    {
      name: 'JIRA_PROJECT_KEY',
      description: 'Jira project key allowlisted in QAnalyzer (e.g. AUTH)',
      platformHint: 'Repository settings → Pipelines → Repository variables',
    },
  ];
}

function renderBitbucketReporter(ctx: CiTemplateContext): CiTemplateResult {
  assertReporterFramework(ctx);
  const nodeVersion = ctx.nodeVersion ?? '22';
  const label = reporterFrameworkLabel(ctx);
  const pkg = reporterPackageName(ctx);
  const configHint = reporterConfigHint(ctx);

  const content = `# QAnalyzer fragment — ${label} ${pkg} reporter path
# Requires ${pkg} in package.json and ${configHint}
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
${bitbucketScriptLines(ctx, frameworkReporterRun(ctx))}
`;

  return {
    platform: 'bitbucket',
    framework: ctx.framework,
    ingestPath: 'reporter',
    filename: 'bitbucket-pipelines.yml',
    content,
    secretsSetup: bitbucketSecrets(),
    variablesSetup: [...bitbucketVariables(), ...planCiVariableHints(), ...versionTagCiVariableHints()],
  };
}

/**
 * Bitbucket Pipelines — upload path or @qanalyzer/forge-vitest / @qanalyzer/forge-jest reporter path.
 */
export function renderBitbucketUpload(ctx: CiTemplateContext): CiTemplateResult {
  if (ctx.ingestPath === 'reporter') {
    return renderBitbucketReporter(ctx);
  }
  if (ctx.ingestPath !== 'upload') {
    throw new UnsupportedVariantError(ctx.platform, ctx.framework, ctx.ingestPath);
  }

  const nodeVersion = ctx.nodeVersion ?? '22';
  const reportFile = ctx.reportFile ?? 'qanalyzer-results.json';
  const testCmd = frameworkTestCommand(ctx);
  const label = frameworkLabel(ctx);
  const uploadBlock = indentUploadCli(ctx, 12);

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
${bitbucketScriptLines(ctx, testCmd)}
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
    variablesSetup: [...bitbucketVariables(), ...planCiVariableHints(), ...versionTagCiVariableHints()],
  };
}
