import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  buildCiTemplateContext,
  generateCiTemplate,
  listCiTemplateVariants,
  vitestJsonRun,
  type CiFramework,
  type CiPlatform,
} from '../ci';

const PLATFORMS: CiPlatform[] = [
  'github',
  'gitlab',
  'azure-devops',
  'jenkins',
  'bitbucket',
];

const FRAMEWORKS: CiFramework[] = ['vitest', 'jest', 'playwright'];
const REPORTER_FRAMEWORKS: CiFramework[] = [
  'vitest',
  'jest',
  'mocha',
  'cucumberjs',
  'cypress',
  'playwright',
  'wdio',
];

const EXPECTED_FILENAMES: Record<CiPlatform, (fw: CiFramework) => string> = {
  github: (fw) => `.github/workflows/qanalyzer-${fw}.yml`,
  gitlab: () => '.gitlab-ci.yml',
  'azure-devops': () => 'azure-pipelines.yml',
  jenkins: () => 'Jenkinsfile',
  bitbucket: () => 'bitbucket-pipelines.yml',
};

describe('buildCiTemplateContext', () => {
  it('fills GitHub secret and launch expressions (proposal §3.2)', () => {
    const ctx = buildCiTemplateContext({
      platform: 'github',
      framework: 'vitest',
      ingestPath: 'upload',
      projectKey: 'AUTH',
    });

    assert.equal(ctx.nodeVersion, '22');
    assert.equal(ctx.reportFile, 'qanalyzer-results.json');
    assert.equal(ctx.ingestUrlSecret, 'QANALYZER_INGEST_URL');
    assert.equal(ctx.ingestTokenSecret, 'QANALYZER_INGEST_TOKEN');
    assert.equal(ctx.projectKeyExpr, '${{ vars.JIRA_PROJECT_KEY }}');
    assert.equal(ctx.ingestUrlExpr, '${{ secrets.QANALYZER_INGEST_URL }}');
    assert.equal(ctx.ingestTokenExpr, '${{ secrets.QANALYZER_INGEST_TOKEN }}');
    assert.equal(ctx.launchNameExpr, '${{ github.workflow }} #${{ github.run_number }}');
    assert.equal(ctx.alwaysGuard, 'if: always()');
  });

  it('fills GitLab / Azure / Jenkins / Bitbucket defaults', () => {
    const gitlab = buildCiTemplateContext({
      platform: 'gitlab',
      framework: 'vitest',
      ingestPath: 'upload',
      projectKey: 'AUTH',
    });
    assert.equal(gitlab.launchNameExpr, '$CI_PIPELINE_ID');
    assert.equal(gitlab.alwaysGuard, 'when: always');
    assert.equal(gitlab.projectKeyExpr, '$JIRA_PROJECT_KEY');

    const azure = buildCiTemplateContext({
      platform: 'azure-devops',
      framework: 'vitest',
      ingestPath: 'upload',
      projectKey: 'AUTH',
    });
    assert.equal(azure.alwaysGuard, 'condition: always()');
    assert.equal(azure.projectKeyExpr, '$(JiraProjectKey)');

    const jenkins = buildCiTemplateContext({
      platform: 'jenkins',
      framework: 'vitest',
      ingestPath: 'upload',
      projectKey: 'AUTH',
    });
    assert.equal(jenkins.launchNameExpr, '${JOB_NAME} #${BUILD_NUMBER}');
    assert.ok(jenkins.alwaysGuard);
    assert.match(jenkins.alwaysGuard, /post \{ always/);

    const bitbucket = buildCiTemplateContext({
      platform: 'bitbucket',
      framework: 'vitest',
      ingestPath: 'upload',
      projectKey: 'AUTH',
    });
    assert.equal(bitbucket.launchNameExpr, 'build-$BITBUCKET_BUILD_NUMBER');
  });
});

describe('listCiTemplateVariants', () => {
  it('returns upload (Vitest/Jest/Playwright) + reporter (… + WDIO) matrix', () => {
    const variants = listCiTemplateVariants();
    // 5 platforms × 3 upload + 5 × 7 reporter = 50
    assert.equal(variants.length, 50);
    for (const platform of PLATFORMS) {
      for (const framework of FRAMEWORKS) {
        assert.ok(
          variants.some(
            (v) =>
              v.platform === platform &&
              v.framework === framework &&
              v.ingestPath === 'upload',
          ),
          `missing ${platform}/${framework}/upload`,
        );
      }
      for (const framework of REPORTER_FRAMEWORKS) {
        assert.ok(
          variants.some(
            (v) =>
              v.platform === platform &&
              v.framework === framework &&
              v.ingestPath === 'reporter',
          ),
          `missing ${platform}/${framework}/reporter`,
        );
      }
      assert.ok(
        !variants.some(
          (v) =>
            v.platform === platform &&
            v.framework === 'cypress' &&
            v.ingestPath === 'upload',
        ),
        `Cypress upload must be unsupported (${platform})`,
      );
      assert.ok(
        !variants.some(
          (v) =>
            v.platform === platform &&
            v.framework === 'wdio' &&
            v.ingestPath === 'upload',
        ),
        `WDIO upload must be unsupported (${platform})`,
      );
      assert.ok(
        !variants.some(
          (v) =>
            v.platform === platform &&
            v.framework === 'mocha' &&
            v.ingestPath === 'upload',
        ),
        `Mocha upload must be unsupported (${platform})`,
      );
      assert.ok(
        !variants.some(
          (v) =>
            v.platform === platform &&
            v.framework === 'cucumberjs' &&
            v.ingestPath === 'upload',
        ),
        `CucumberJS upload must be unsupported (${platform})`,
      );
    }
  });
});

describe('generateCiTemplate — all platforms × frameworks', () => {
  for (const platform of PLATFORMS) {
    for (const framework of FRAMEWORKS) {
      it(`${platform} / ${framework} / upload`, () => {
        const result = generateCiTemplate({
          platform,
          framework,
          ingestPath: 'upload',
          projectKey: 'AUTH',
        });

        assert.equal(result.platform, platform);
        assert.equal(result.framework, framework);
        assert.equal(result.ingestPath, 'upload');
        assert.equal(result.filename, EXPECTED_FILENAMES[platform](framework));
        assert.match(result.content, /npx qa-forge-api-client/);
        assert.doesNotMatch(result.content, /Bearer\s+\S+/);
        assert.doesNotMatch(result.content, /qanalyzer-upload\.js/);
        assert.ok(result.secretsSetup.length >= 2);
        assert.ok(result.variablesSetup.length >= 1);
        assert.ok(
          result.variablesSetup.some((v) => v.name === 'QANALYZER_PLAN_NAME'),
          'documents QANALYZER_PLAN_NAME for Test Plans (FR158)',
        );
        assert.ok(
          result.variablesSetup.some((v) => v.name === 'QANALYZER_FIX_VERSION'),
          'documents QANALYZER_FIX_VERSION for version tags (FR21)',
        );

        if (framework === 'vitest') {
          assert.match(
            result.content,
            /npx vitest run --reporter=json --outputFile=qanalyzer-results\.json/,
          );
        } else if (framework === 'jest') {
          assert.match(result.content, /npx jest --json --outputFile=qanalyzer-results\.json/);
        } else {
          assert.match(result.content, /npx playwright test --reporter=json/);
          assert.match(result.content, /npx playwright install --with-deps/);
        }
      });
    }
  }
});

describe('generateCiTemplate — Vitest upload snapshots (proposal §5)', () => {
  it('§5.1 GitHub', () => {
    const { content, filename } = generateCiTemplate({
      platform: 'github',
      framework: 'vitest',
      ingestPath: 'upload',
      projectKey: 'AUTH',
    });
    assert.equal(filename, '.github/workflows/qanalyzer-vitest.yml');
    assert.equal(
      content,
      `name: QAnalyzer Vitest

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
`,
    );
  });

  it('§5.2 GitLab', () => {
    const { content, filename } = generateCiTemplate({
      platform: 'gitlab',
      framework: 'vitest',
      ingestPath: 'upload',
      projectKey: 'AUTH',
    });
    assert.equal(filename, '.gitlab-ci.yml');
    assert.match(content, /# QAnalyzer fragment/);
    assert.match(content, /when: always/);
    assert.match(content, /needs: \[vitest\]/);
    assert.match(content, /--project "\$JIRA_PROJECT_KEY"/);
    assert.match(content, /--launch "\$CI_PIPELINE_ID"/);
    assert.equal(
      content,
      `# QAnalyzer fragment — merge into your .gitlab-ci.yml
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
`,
    );
  });

  it('§5.3 Jenkins', () => {
    const { content, filename } = generateCiTemplate({
      platform: 'jenkins',
      framework: 'vitest',
      ingestPath: 'upload',
      projectKey: 'AUTH',
    });
    assert.equal(filename, 'Jenkinsfile');
    assert.match(content, /withCredentials/);
    assert.match(content, /credentialsId: 'qanalyzer-ingest-url'/);
    assert.match(content, /JIRA_PROJECT_KEY = 'AUTH'/);
    assert.equal(
      content,
      `// QAnalyzer fragment — Vitest upload path — merge into your Jenkinsfile
pipeline {
  agent any
  environment {
    JIRA_PROJECT_KEY = 'AUTH'
  }
  stages {
    stage('Test') {
      steps {
        sh 'npm ci'
        sh -c 'npx vitest run --reporter=json --outputFile=qanalyzer-results.json'
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
`,
    );
  });

  it('§5.4 Bitbucket', () => {
    const { content, filename } = generateCiTemplate({
      platform: 'bitbucket',
      framework: 'vitest',
      ingestPath: 'upload',
      projectKey: 'AUTH',
    });
    assert.equal(filename, 'bitbucket-pipelines.yml');
    assert.equal(
      content,
      `# QAnalyzer fragment — merge into your bitbucket-pipelines.yml
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
`,
    );
  });

  it('§5.5 Azure DevOps', () => {
    const { content, filename } = generateCiTemplate({
      platform: 'azure-devops',
      framework: 'vitest',
      ingestPath: 'upload',
      projectKey: 'AUTH',
    });
    assert.equal(filename, 'azure-pipelines.yml');
    assert.equal(
      content,
      `# QAnalyzer fragment — Vitest upload path
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
`,
    );
  });
});

describe('reporter path (qa-vitest / qa-jest / qa-mocha / qa-cucumberjs / qa-cypress / qa-playwright / qa-wdio)', () => {
  for (const platform of PLATFORMS) {
    for (const framework of REPORTER_FRAMEWORKS) {
      it(`${platform} / ${framework} / reporter`, () => {
        const result = generateCiTemplate({
          platform,
          framework,
          ingestPath: 'reporter',
          projectKey: 'AUTH',
        });
        assert.equal(result.ingestPath, 'reporter');
        assert.equal(result.framework, framework);
        assert.match(result.content, /QANALYZER_MODE/);
        const runPattern =
          framework === 'jest'
            ? /npx jest --runInBand/
            : framework === 'mocha'
              ? /npx mocha/
              : framework === 'cucumberjs'
                ? /npx cucumber-js/
                : framework === 'cypress'
                  ? /npx cypress run/
                  : framework === 'playwright'
                    ? /npx playwright test/
                    : framework === 'wdio'
                      ? /npx wdio run wdio\.conf\.js/
                      : /npx vitest run/;
        assert.match(result.content, runPattern);
        if (framework === 'playwright') {
          assert.match(result.content, /npx playwright install --with-deps/);
          assert.match(result.content, /qa-playwright/);
        }
        if (framework === 'wdio') {
          assert.match(result.content, /qa-wdio/);
          assert.match(result.content, /headless Chrome/);
        }
        if (framework === 'mocha') {
          assert.match(result.content, /qa-mocha/);
          assert.match(result.content, /\.mocharc\.js/);
        }
        if (framework === 'cucumberjs') {
          assert.match(result.content, /qa-cucumberjs/);
          assert.match(result.content, /cucumber\.js/);
        }
        assert.doesNotMatch(result.content, /qa-forge-api-client/);
        assert.doesNotMatch(result.content, /Bearer\s+\S+/i);
        assert.ok(
          result.variablesSetup.some((v) => v.name === 'QANALYZER_PLAN_NAME'),
          'documents QANALYZER_PLAN_NAME for Test Plans (FR158)',
        );
        assert.ok(
          result.variablesSetup.some((v) => v.name === 'QANALYZER_FIX_VERSION'),
          'documents QANALYZER_FIX_VERSION for version tags (FR21)',
        );
      });
    }
  }

  it('rejects Cypress upload path', () => {
    assert.throws(
      () =>
        generateCiTemplate({
          platform: 'github',
          framework: 'cypress',
          ingestPath: 'upload',
          projectKey: 'AUTH',
        }),
      /Unsupported CI template variant/,
    );
  });

  it('rejects WDIO upload path', () => {
    assert.throws(
      () =>
        generateCiTemplate({
          platform: 'github',
          framework: 'wdio',
          ingestPath: 'upload',
          projectKey: 'AUTH',
        }),
      /Unsupported CI template variant/,
    );
  });

  it('rejects Mocha upload path', () => {
    assert.throws(
      () =>
        generateCiTemplate({
          platform: 'github',
          framework: 'mocha',
          ingestPath: 'upload',
          projectKey: 'AUTH',
        }),
      /Unsupported CI template variant/,
    );
  });

  it('rejects CucumberJS upload path', () => {
    assert.throws(
      () =>
        generateCiTemplate({
          platform: 'github',
          framework: 'cucumberjs',
          ingestPath: 'upload',
          projectKey: 'AUTH',
        }),
      /Unsupported CI template variant/,
    );
  });

  it('supports Playwright upload JSON path', () => {
    const result = generateCiTemplate({
      platform: 'github',
      framework: 'playwright',
      ingestPath: 'upload',
      projectKey: 'AUTH',
    });
    assert.match(result.content, /npx playwright test --reporter=json/);
    assert.match(result.content, /npx playwright install --with-deps/);
    assert.match(result.content, /qa-forge-api-client/);
    assert.doesNotMatch(result.content, /Bearer\s+\S+/i);
  });
});

describe('vitestJsonRun', () => {
  it('builds the Vitest JSON reporter command', () => {
    assert.equal(
      vitestJsonRun('out.json'),
      'npx vitest run --reporter=json --outputFile=out.json',
    );
  });
});
