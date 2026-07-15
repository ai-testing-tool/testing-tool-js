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

function jenkinsShLines(indent: string, ctx: CiTemplateContext, ...cmds: string[]): string {
  // Use sh -c so redirects in Playwright JSON upload (`> file`) work.
  return [...reporterPreRunScripts(ctx), ...cmds]
    .map((cmd) => `${indent}sh -c '${cmd.replace(/'/g, `'\"'\"'`)}'`)
    .join('\n');
}

function jenkinsSecrets(): CiSecretHint[] {
  return [
    {
      name: 'qanalyzer-ingest-url',
      description: 'Secret text credential: Forge web trigger URL (ingest + attach)',
      platformHint: "Manage Jenkins → Credentials → Add → Secret text; ID `qanalyzer-ingest-url`",
    },
    {
      name: 'qanalyzer-ingest-token',
      description: 'Secret text credential: Bearer token from QAnalyzer configure page',
      platformHint: "Manage Jenkins → Credentials → Add → Secret text; ID `qanalyzer-ingest-token`",
    },
  ];
}

function jenkinsVariables(): CiVariableHint[] {
  return [
    {
      name: 'JIRA_PROJECT_KEY',
      description: 'Jira project key allowlisted in QAnalyzer (set in Jenkinsfile environment)',
      platformHint: 'pipeline environment { JIRA_PROJECT_KEY = \'…\' } or Jenkins folder property',
    },
  ];
}

function renderJenkinsReporter(ctx: CiTemplateContext): CiTemplateResult {
  assertReporterFramework(ctx);
  const label = reporterFrameworkLabel(ctx);
  const pkg = reporterPackageName(ctx);
  const configHint = reporterConfigHint(ctx);

  const content = `// QAnalyzer fragment — ${label} ${pkg} reporter path
// Requires ${pkg} in package.json and ${configHint}
pipeline {
  agent any
  environment {
    JIRA_PROJECT_KEY = '${ctx.projectKey}'
    QANALYZER_MODE = 'ingest'
    QANALYZER_PROJECT_KEY = '${ctx.projectKey}'
  }
  stages {
    stage('Test') {
      steps {
        withCredentials([
          string(credentialsId: 'qanalyzer-ingest-url', variable: 'QANALYZER_INGEST_URL'),
          string(credentialsId: 'qanalyzer-ingest-token', variable: 'QANALYZER_INGEST_TOKEN'),
        ]) {
          sh 'npm ci'
${jenkinsShLines('          ', ctx, frameworkReporterRun(ctx))}
        }
      }
    }
  }
}
`;

  return {
    platform: 'jenkins',
    framework: ctx.framework,
    ingestPath: 'reporter',
    filename: 'Jenkinsfile',
    content,
    secretsSetup: jenkinsSecrets(),
    variablesSetup: [...jenkinsVariables(), ...planCiVariableHints(), ...versionTagCiVariableHints()],
  };
}

/**
 * Jenkins — upload path or qa-forge-vitest / qa-forge-jest reporter path.
 */
export function renderJenkinsUpload(ctx: CiTemplateContext): CiTemplateResult {
  if (ctx.ingestPath === 'reporter') {
    return renderJenkinsReporter(ctx);
  }
  if (ctx.ingestPath !== 'upload') {
    throw new UnsupportedVariantError(ctx.platform, ctx.framework, ctx.ingestPath);
  }

  const testCmd = frameworkTestCommand(ctx);
  const label = frameworkLabel(ctx);
  const uploadBlock = indentUploadCli(ctx, 10);

  const content = `// QAnalyzer fragment — ${label} upload path — merge into your Jenkinsfile
pipeline {
  agent any
  environment {
    JIRA_PROJECT_KEY = '${ctx.projectKey}'
  }
  stages {
    stage('Test') {
      steps {
        sh 'npm ci'
${jenkinsShLines('        ', ctx, testCmd)}
      }
    }
  }
  post {
    always {
      withCredentials([
        string(credentialsId: 'qanalyzer-ingest-url', variable: 'QANALYZER_INGEST_URL'),
        string(credentialsId: 'qanalyzer-ingest-token', variable: 'QANALYZER_INGEST_TOKEN'),
      ]) {
        sh '''
${uploadBlock}
        '''
      }
    }
  }
}
`;

  return {
    platform: 'jenkins',
    framework: ctx.framework,
    ingestPath: 'upload',
    filename: 'Jenkinsfile',
    content,
    secretsSetup: jenkinsSecrets(),
    variablesSetup: [...jenkinsVariables(), ...planCiVariableHints(), ...versionTagCiVariableHints()],
  };
}
