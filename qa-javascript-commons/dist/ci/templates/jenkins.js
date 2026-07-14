"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderJenkinsUpload = renderJenkinsUpload;
const upload_1 = require("../frameworks/upload");
const reporter_1 = require("../frameworks/reporter");
const types_1 = require("../types");
function jenkinsShLines(indent, ctx, ...cmds) {
    // Use sh -c so redirects in Playwright JSON upload (`> file`) work.
    return [...(0, reporter_1.reporterPreRunScripts)(ctx), ...cmds]
        .map((cmd) => `${indent}sh -c '${cmd.replace(/'/g, `'\"'\"'`)}'`)
        .join('\n');
}
function jenkinsSecrets() {
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
function jenkinsVariables() {
    return [
        {
            name: 'JIRA_PROJECT_KEY',
            description: 'Jira project key allowlisted in QAnalyzer (set in Jenkinsfile environment)',
            platformHint: 'pipeline environment { JIRA_PROJECT_KEY = \'…\' } or Jenkins folder property',
        },
    ];
}
function renderJenkinsReporter(ctx) {
    (0, reporter_1.assertReporterFramework)(ctx);
    const label = (0, reporter_1.reporterFrameworkLabel)(ctx);
    const pkg = (0, reporter_1.reporterPackageName)(ctx);
    const configHint = (0, reporter_1.reporterConfigHint)(ctx);
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
${jenkinsShLines('          ', ctx, (0, reporter_1.frameworkReporterRun)(ctx))}
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
        variablesSetup: [...jenkinsVariables(), ...(0, reporter_1.planCiVariableHints)(), ...(0, reporter_1.versionTagCiVariableHints)()],
    };
}
/**
 * Jenkins — upload path or qa-vitest / qa-jest reporter path.
 */
function renderJenkinsUpload(ctx) {
    if (ctx.ingestPath === 'reporter') {
        return renderJenkinsReporter(ctx);
    }
    if (ctx.ingestPath !== 'upload') {
        throw new types_1.UnsupportedVariantError(ctx.platform, ctx.framework, ctx.ingestPath);
    }
    const testCmd = (0, upload_1.frameworkTestCommand)(ctx);
    const label = (0, upload_1.frameworkLabel)(ctx);
    const uploadBlock = (0, upload_1.indentUploadCli)(ctx, 10);
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
        variablesSetup: [...jenkinsVariables(), ...(0, reporter_1.planCiVariableHints)(), ...(0, reporter_1.versionTagCiVariableHints)()],
    };
}
