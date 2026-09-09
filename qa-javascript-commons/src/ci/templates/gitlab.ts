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

function gitlabScriptLines(ctx: CiTemplateContext, ...cmds: string[]): string {
  return [...reporterPreRunScripts(ctx), ...cmds].map((c) => `    - ${c}`).join('\n');
}

function gitlabSecrets(): CiSecretHint[] {
  return [
    {
      name: 'AI_TESTING_TOOL_INGEST_URL',
      description:
        'Forge web trigger URL (launch ingest + binary attach / screenshots / qa.attach)',
      platformHint: 'Settings → CI/CD → Variables → Add variable (Masked + Protected as needed)',
    },
    {
      name: 'AI_TESTING_TOOL_INGEST_TOKEN',
      description: 'Bearer token from AiTestingTool configure page (shown once)',
      platformHint: 'Settings → CI/CD → Variables → Add variable (Masked + Protected)',
    },
  ];
}

function gitlabVariables(): CiVariableHint[] {
  return [
    {
      name: 'JIRA_PROJECT_KEY',
      description: 'Jira project key allowlisted in AiTestingTool (e.g. AUTH)',
      platformHint: 'Settings → CI/CD → Variables',
    },
  ];
}

function renderGitlabReporter(ctx: CiTemplateContext): CiTemplateResult {
  assertReporterFramework(ctx);
  const nodeVersion = ctx.nodeVersion ?? '22';
  const label = reporterFrameworkLabel(ctx);
  const pkg = reporterPackageName(ctx);
  const configHint = reporterConfigHint(ctx);
  const jobName = ctx.framework;

  const content = `# AiTestingTool fragment — ${label} ${pkg} reporter path
# Requires ${pkg} in package.json and ${configHint}
stages:
  - test

${jobName}:
  stage: test
  image: node:${nodeVersion}-alpine
  variables:
    AI_TESTING_TOOL_MODE: ingest
    AI_TESTING_TOOL_INGEST_URL: $AI_TESTING_TOOL_INGEST_URL
    AI_TESTING_TOOL_INGEST_TOKEN: $AI_TESTING_TOOL_INGEST_TOKEN
    AI_TESTING_TOOL_PROJECT_KEY: $JIRA_PROJECT_KEY
    AI_TESTING_TOOL_LAUNCH_NAME: $CI_PIPELINE_ID
    # Optional Test Plan: AI_TESTING_TOOL_PLAN_NAME / AI_TESTING_TOOL_PLAN_ID / AI_TESTING_TOOL_PLAN_KEY
    # Optional tags: AI_TESTING_TOOL_FIX_VERSION / AI_TESTING_TOOL_SPRINT
  script:
    - npm ci
${gitlabScriptLines(ctx, frameworkReporterRun(ctx))}
`;

  return {
    platform: 'gitlab',
    framework: ctx.framework,
    ingestPath: 'reporter',
    filename: '.gitlab-ci.yml',
    content,
    secretsSetup: gitlabSecrets(),
    variablesSetup: [...gitlabVariables(), ...planCiVariableHints(), ...versionTagCiVariableHints()],
  };
}

/**
 * GitLab CI — upload path or @ai-testing-tool/forge-vitest / @ai-testing-tool/forge-jest reporter path.
 */
export function renderGitlabUpload(ctx: CiTemplateContext): CiTemplateResult {
  if (ctx.ingestPath === 'reporter') {
    return renderGitlabReporter(ctx);
  }
  if (ctx.ingestPath !== 'upload') {
    throw new UnsupportedVariantError(ctx.platform, ctx.framework, ctx.ingestPath);
  }

  const nodeVersion = ctx.nodeVersion ?? '22';
  const reportFile = ctx.reportFile ?? 'ai-testing-tool-results.json';
  const testCmd = frameworkTestCommand(ctx);
  const jobName = ctx.framework;
  const label = frameworkLabel(ctx);
  const uploadBlock = indentUploadCli(ctx, 6);

  const content = `# AiTestingTool fragment — merge into your .gitlab-ci.yml
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

ai-testing-tool_upload:
  stage: report
  image: node:${nodeVersion}-alpine
  when: always
  needs: [${jobName}]
  variables:
    AI_TESTING_TOOL_INGEST_URL: $AI_TESTING_TOOL_INGEST_URL
    AI_TESTING_TOOL_INGEST_TOKEN: $AI_TESTING_TOOL_INGEST_TOKEN
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
    variablesSetup: [...gitlabVariables(), ...planCiVariableHints(), ...versionTagCiVariableHints()],
  };
}
