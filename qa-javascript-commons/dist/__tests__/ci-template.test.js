"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const ci_1 = require("../ci");
const PLATFORMS = [
    'github',
    'gitlab',
    'azure-devops',
    'jenkins',
    'bitbucket',
];
const FRAMEWORKS = ['vitest', 'jest'];
const EXPECTED_FILENAMES = {
    github: (fw) => `.github/workflows/qanalyzer-${fw}.yml`,
    gitlab: () => '.gitlab-ci.yml',
    'azure-devops': () => 'azure-pipelines.yml',
    jenkins: () => 'Jenkinsfile',
    bitbucket: () => 'bitbucket-pipelines.yml',
};
(0, node_test_1.describe)('buildCiTemplateContext', () => {
    (0, node_test_1.it)('fills GitHub secret and launch expressions (proposal §3.2)', () => {
        const ctx = (0, ci_1.buildCiTemplateContext)({
            platform: 'github',
            framework: 'vitest',
            ingestPath: 'upload',
            projectKey: 'AUTH',
        });
        strict_1.default.equal(ctx.nodeVersion, '22');
        strict_1.default.equal(ctx.reportFile, 'qanalyzer-results.json');
        strict_1.default.equal(ctx.ingestUrlSecret, 'QANALYZER_INGEST_URL');
        strict_1.default.equal(ctx.ingestTokenSecret, 'QANALYZER_INGEST_TOKEN');
        strict_1.default.equal(ctx.projectKeyExpr, '${{ vars.JIRA_PROJECT_KEY }}');
        strict_1.default.equal(ctx.ingestUrlExpr, '${{ secrets.QANALYZER_INGEST_URL }}');
        strict_1.default.equal(ctx.ingestTokenExpr, '${{ secrets.QANALYZER_INGEST_TOKEN }}');
        strict_1.default.equal(ctx.launchNameExpr, '${{ github.workflow }} #${{ github.run_number }}');
        strict_1.default.equal(ctx.alwaysGuard, 'if: always()');
    });
    (0, node_test_1.it)('fills GitLab / Azure / Jenkins / Bitbucket defaults', () => {
        const gitlab = (0, ci_1.buildCiTemplateContext)({
            platform: 'gitlab',
            framework: 'vitest',
            ingestPath: 'upload',
            projectKey: 'AUTH',
        });
        strict_1.default.equal(gitlab.launchNameExpr, '$CI_PIPELINE_ID');
        strict_1.default.equal(gitlab.alwaysGuard, 'when: always');
        strict_1.default.equal(gitlab.projectKeyExpr, '$JIRA_PROJECT_KEY');
        const azure = (0, ci_1.buildCiTemplateContext)({
            platform: 'azure-devops',
            framework: 'vitest',
            ingestPath: 'upload',
            projectKey: 'AUTH',
        });
        strict_1.default.equal(azure.alwaysGuard, 'condition: always()');
        strict_1.default.equal(azure.projectKeyExpr, '$(JiraProjectKey)');
        const jenkins = (0, ci_1.buildCiTemplateContext)({
            platform: 'jenkins',
            framework: 'vitest',
            ingestPath: 'upload',
            projectKey: 'AUTH',
        });
        strict_1.default.equal(jenkins.launchNameExpr, '${JOB_NAME} #${BUILD_NUMBER}');
        strict_1.default.ok(jenkins.alwaysGuard);
        strict_1.default.match(jenkins.alwaysGuard, /post \{ always/);
        const bitbucket = (0, ci_1.buildCiTemplateContext)({
            platform: 'bitbucket',
            framework: 'vitest',
            ingestPath: 'upload',
            projectKey: 'AUTH',
        });
        strict_1.default.equal(bitbucket.launchNameExpr, 'build-$BITBUCKET_BUILD_NUMBER');
    });
});
(0, node_test_1.describe)('listCiTemplateVariants', () => {
    (0, node_test_1.it)('returns upload matrix plus Vitest reporter variants', () => {
        const variants = (0, ci_1.listCiTemplateVariants)();
        strict_1.default.equal(variants.length, 15);
        for (const platform of PLATFORMS) {
            for (const framework of FRAMEWORKS) {
                strict_1.default.ok(variants.some((v) => v.platform === platform &&
                    v.framework === framework &&
                    v.ingestPath === 'upload'), `missing ${platform}/${framework}/upload`);
            }
            strict_1.default.ok(variants.some((v) => v.platform === platform &&
                v.framework === 'vitest' &&
                v.ingestPath === 'reporter'), `missing ${platform}/vitest/reporter`);
        }
        strict_1.default.ok(!variants.some((v) => v.framework === 'jest' && v.ingestPath === 'reporter'));
    });
});
(0, node_test_1.describe)('generateCiTemplate — all platforms × frameworks', () => {
    for (const platform of PLATFORMS) {
        for (const framework of FRAMEWORKS) {
            (0, node_test_1.it)(`${platform} / ${framework} / upload`, () => {
                const result = (0, ci_1.generateCiTemplate)({
                    platform,
                    framework,
                    ingestPath: 'upload',
                    projectKey: 'AUTH',
                });
                strict_1.default.equal(result.platform, platform);
                strict_1.default.equal(result.framework, framework);
                strict_1.default.equal(result.ingestPath, 'upload');
                strict_1.default.equal(result.filename, EXPECTED_FILENAMES[platform](framework));
                strict_1.default.match(result.content, /npx qa-forge-api-client/);
                strict_1.default.doesNotMatch(result.content, /Bearer\s+\S+/);
                strict_1.default.doesNotMatch(result.content, /qanalyzer-upload\.js/);
                strict_1.default.ok(result.secretsSetup.length >= 2);
                strict_1.default.ok(result.variablesSetup.length >= 1);
                if (framework === 'vitest') {
                    strict_1.default.match(result.content, /npx vitest run --reporter=json --outputFile=qanalyzer-results\.json/);
                }
                else {
                    strict_1.default.match(result.content, /npx jest --json --outputFile=qanalyzer-results\.json/);
                }
            });
        }
    }
});
(0, node_test_1.describe)('generateCiTemplate — Vitest upload snapshots (proposal §5)', () => {
    (0, node_test_1.it)('§5.1 GitHub', () => {
        const { content, filename } = (0, ci_1.generateCiTemplate)({
            platform: 'github',
            framework: 'vitest',
            ingestPath: 'upload',
            projectKey: 'AUTH',
        });
        strict_1.default.equal(filename, '.github/workflows/qanalyzer-vitest.yml');
        strict_1.default.equal(content, `name: QAnalyzer Vitest

on:
  push:
    branches: [main]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "22"
          cache: npm
      - run: npm ci
      - run: npx vitest run --reporter=json --outputFile=qanalyzer-results.json
      - name: Upload to QAnalyzer
        if: always()
        env:
          QANALYZER_INGEST_URL: \${{ secrets.QANALYZER_INGEST_URL }}
          QANALYZER_INGEST_TOKEN: \${{ secrets.QANALYZER_INGEST_TOKEN }}
        run: |
          npx qa-forge-api-client \\
            --project "\${{ vars.JIRA_PROJECT_KEY }}" \\
            --launch "\${{ github.workflow }} #\${{ github.run_number }}" \\
            --report qanalyzer-results.json
`);
    });
    (0, node_test_1.it)('§5.2 GitLab', () => {
        const { content, filename } = (0, ci_1.generateCiTemplate)({
            platform: 'gitlab',
            framework: 'vitest',
            ingestPath: 'upload',
            projectKey: 'AUTH',
        });
        strict_1.default.equal(filename, '.gitlab-ci.yml');
        strict_1.default.match(content, /# QAnalyzer fragment/);
        strict_1.default.match(content, /when: always/);
        strict_1.default.match(content, /needs: \[vitest\]/);
        strict_1.default.match(content, /--project "\$JIRA_PROJECT_KEY"/);
        strict_1.default.match(content, /--launch "\$CI_PIPELINE_ID"/);
        strict_1.default.equal(content, `# QAnalyzer fragment — merge into your .gitlab-ci.yml
# Vitest upload path
stages:
  - test
  - report

vitest:
  stage: test
  image: node:22-alpine
  script:
    - npm ci
    - npx vitest run --reporter=json --outputFile=qanalyzer-results.json
  artifacts:
    when: always
    paths:
      - qanalyzer-results.json

qanalyzer_upload:
  stage: report
  image: node:22-alpine
  when: always
  needs: [vitest]
  variables:
    QANALYZER_INGEST_URL: $QANALYZER_INGEST_URL
    QANALYZER_INGEST_TOKEN: $QANALYZER_INGEST_TOKEN
  script:
    - |
      npx qa-forge-api-client \\
        --project "$JIRA_PROJECT_KEY" \\
        --launch "$CI_PIPELINE_ID" \\
        --report qanalyzer-results.json
`);
    });
    (0, node_test_1.it)('§5.3 Jenkins', () => {
        const { content, filename } = (0, ci_1.generateCiTemplate)({
            platform: 'jenkins',
            framework: 'vitest',
            ingestPath: 'upload',
            projectKey: 'AUTH',
        });
        strict_1.default.equal(filename, 'Jenkinsfile');
        strict_1.default.match(content, /withCredentials/);
        strict_1.default.match(content, /credentialsId: 'qanalyzer-ingest-url'/);
        strict_1.default.match(content, /JIRA_PROJECT_KEY = 'AUTH'/);
        strict_1.default.equal(content, `// QAnalyzer fragment — Vitest upload path — merge into your Jenkinsfile
pipeline {
  agent any
  environment {
    JIRA_PROJECT_KEY = 'AUTH'
  }
  stages {
    stage('Test') {
      steps {
        sh 'npm ci'
        sh 'npx vitest run --reporter=json --outputFile=qanalyzer-results.json'
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
          npx qa-forge-api-client \\
            --project "\${JIRA_PROJECT_KEY}" \\
            --launch "\${JOB_NAME} #\${BUILD_NUMBER}" \\
            --report qanalyzer-results.json
        '''
      }
    }
  }
}
`);
    });
    (0, node_test_1.it)('§5.4 Bitbucket', () => {
        const { content, filename } = (0, ci_1.generateCiTemplate)({
            platform: 'bitbucket',
            framework: 'vitest',
            ingestPath: 'upload',
            projectKey: 'AUTH',
        });
        strict_1.default.equal(filename, 'bitbucket-pipelines.yml');
        strict_1.default.equal(content, `# QAnalyzer fragment — merge into your bitbucket-pipelines.yml
# Vitest upload path — set secured vars QANALYZER_INGEST_URL / QANALYZER_INGEST_TOKEN
image: node:22

pipelines:
  default:
    - step:
        name: Test
        caches:
          - node
        script:
          - npm ci
          - npx vitest run --reporter=json --outputFile=qanalyzer-results.json
        artifacts:
          - qanalyzer-results.json
    - step:
        name: Upload QAnalyzer
        script:
          - |
            npx qa-forge-api-client \\
              --project "$JIRA_PROJECT_KEY" \\
              --launch "build-$BITBUCKET_BUILD_NUMBER" \\
              --report qanalyzer-results.json
`);
    });
    (0, node_test_1.it)('§5.5 Azure DevOps', () => {
        const { content, filename } = (0, ci_1.generateCiTemplate)({
            platform: 'azure-devops',
            framework: 'vitest',
            ingestPath: 'upload',
            projectKey: 'AUTH',
        });
        strict_1.default.equal(filename, 'azure-pipelines.yml');
        strict_1.default.equal(content, `# QAnalyzer fragment — Vitest upload path
trigger:
  - main

pool:
  vmImage: ubuntu-latest

variables:
  - group: qanalyzer-secrets   # QANALYZER_INGEST_URL, QANALYZER_INGEST_TOKEN
  - name: JiraProjectKey
    value: AUTH

steps:
  - task: NodeTool@0
    inputs:
      versionSpec: '22.x'
    displayName: Use Node.js 22

  - script: npm ci
    displayName: Install dependencies

  - script: npx vitest run --reporter=json --outputFile=qanalyzer-results.json
    displayName: Run Vitest

  - script: |
      npx qa-forge-api-client \\
        --project "$(JiraProjectKey)" \\
        --launch "$(Build.DefinitionName) #$(Build.BuildNumber)" \\
        --report qanalyzer-results.json
    displayName: Upload to QAnalyzer
    condition: always()
    env:
      QANALYZER_INGEST_URL: $(QANALYZER_INGEST_URL)
      QANALYZER_INGEST_TOKEN: $(QANALYZER_INGEST_TOKEN)
`);
    });
});
(0, node_test_1.describe)('reporter path (qa-vitest)', () => {
    for (const platform of PLATFORMS) {
        (0, node_test_1.it)(`${platform} / vitest / reporter`, () => {
            const result = (0, ci_1.generateCiTemplate)({
                platform,
                framework: 'vitest',
                ingestPath: 'reporter',
                projectKey: 'AUTH',
            });
            strict_1.default.equal(result.ingestPath, 'reporter');
            strict_1.default.match(result.content, /QANALYZER_MODE/);
            strict_1.default.match(result.content, /npx vitest run/);
            strict_1.default.doesNotMatch(result.content, /qa-forge-api-client/);
            strict_1.default.doesNotMatch(result.content, /Bearer\s+\S+/i);
        });
    }
    (0, node_test_1.it)('throws UnsupportedVariantError for jest reporter', () => {
        strict_1.default.throws(() => (0, ci_1.generateCiTemplate)({
            platform: 'github',
            framework: 'jest',
            ingestPath: 'reporter',
            projectKey: 'AUTH',
        }), (err) => err instanceof ci_1.UnsupportedVariantError);
    });
});
(0, node_test_1.describe)('vitestJsonRun', () => {
    (0, node_test_1.it)('builds the Vitest JSON reporter command', () => {
        strict_1.default.equal((0, ci_1.vitestJsonRun)('out.json'), 'npx vitest run --reporter=json --outputFile=out.json');
    });
});
