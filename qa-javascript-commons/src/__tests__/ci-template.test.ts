import { qaDescribe, qaItAuto, expect } from '@qa/test';

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
  github: (fw) => `.github/workflows/ai-testing-tool-${fw}.yml`,
  gitlab: () => '.gitlab-ci.yml',
  'azure-devops': () => 'azure-pipelines.yml',
  jenkins: () => 'Jenkinsfile',
  bitbucket: () => 'bitbucket-pipelines.yml',
};

qaDescribe('buildCiTemplateContext', () => {
  qaItAuto('fills GitHub secret and launch expressions (proposal §3.2)', () => {
    const ctx = buildCiTemplateContext({
      platform: 'github',
      framework: 'vitest',
      ingestPath: 'upload',
      projectKey: 'AUTH',
    });

    expect(ctx.nodeVersion).toBe('22');
    expect(ctx.reportFile).toBe('ai-testing-tool-results.json');
    expect(ctx.ingestUrlSecret).toBe('AI_TESTING_TOOL_INGEST_URL');
    expect(ctx.ingestTokenSecret).toBe('AI_TESTING_TOOL_INGEST_TOKEN');
    expect(ctx.projectKeyExpr).toBe('${{ vars.JIRA_PROJECT_KEY }}');
    expect(ctx.ingestUrlExpr).toBe('${{ secrets.AI_TESTING_TOOL_INGEST_URL }}');
    expect(ctx.ingestTokenExpr).toBe('${{ secrets.AI_TESTING_TOOL_INGEST_TOKEN }}');
    expect(ctx.launchNameExpr).toBe('${{ github.workflow }} #${{ github.run_number }}');
    expect(ctx.alwaysGuard).toBe('if: always()');
  });

  qaItAuto('fills GitLab / Azure / Jenkins / Bitbucket defaults', () => {
    const gitlab = buildCiTemplateContext({
      platform: 'gitlab',
      framework: 'vitest',
      ingestPath: 'upload',
      projectKey: 'AUTH',
    });
    expect(gitlab.launchNameExpr).toBe('$CI_PIPELINE_ID');
    expect(gitlab.alwaysGuard).toBe('when: always');
    expect(gitlab.projectKeyExpr).toBe('$JIRA_PROJECT_KEY');

    const azure = buildCiTemplateContext({
      platform: 'azure-devops',
      framework: 'vitest',
      ingestPath: 'upload',
      projectKey: 'AUTH',
    });
    expect(azure.alwaysGuard).toBe('condition: always()');
    expect(azure.projectKeyExpr).toBe('$(JiraProjectKey)');

    const jenkins = buildCiTemplateContext({
      platform: 'jenkins',
      framework: 'vitest',
      ingestPath: 'upload',
      projectKey: 'AUTH',
    });
    expect(jenkins.launchNameExpr).toBe('${JOB_NAME} #${BUILD_NUMBER}');
    expect(jenkins.alwaysGuard).toBeTruthy();
    expect(jenkins.alwaysGuard).toMatch(/post \{ always/);

    const bitbucket = buildCiTemplateContext({
      platform: 'bitbucket',
      framework: 'vitest',
      ingestPath: 'upload',
      projectKey: 'AUTH',
    });
    expect(bitbucket.launchNameExpr).toBe('build-$BITBUCKET_BUILD_NUMBER');
  });
});

qaDescribe('listCiTemplateVariants', () => {
  qaItAuto('returns upload (Vitest/Jest/Playwright) + reporter (… + WDIO) matrix', () => {
    const variants = listCiTemplateVariants();
    // 5 platforms × 3 upload + 5 × 7 reporter = 50
    expect(variants.length).toBe(50);
    for (const platform of PLATFORMS) {
      for (const framework of FRAMEWORKS) {
        expect(variants.some(
            (v) =>
              v.platform === platform &&
              v.framework === framework &&
              v.ingestPath === 'upload',
          )).toBeTruthy();
      }
      for (const framework of REPORTER_FRAMEWORKS) {
        expect(variants.some(
            (v) =>
              v.platform === platform &&
              v.framework === framework &&
              v.ingestPath === 'reporter',
          )).toBeTruthy();
      }
      expect(!variants.some(
          (v) =>
            v.platform === platform &&
            v.framework === 'cypress' &&
            v.ingestPath === 'upload',
        )).toBeTruthy();
      expect(!variants.some(
          (v) =>
            v.platform === platform &&
            v.framework === 'wdio' &&
            v.ingestPath === 'upload',
        )).toBeTruthy();
      expect(!variants.some(
          (v) =>
            v.platform === platform &&
            v.framework === 'mocha' &&
            v.ingestPath === 'upload',
        )).toBeTruthy();
      expect(!variants.some(
          (v) =>
            v.platform === platform &&
            v.framework === 'cucumberjs' &&
            v.ingestPath === 'upload',
        )).toBeTruthy();
    }
  });
});

qaDescribe('generateCiTemplate — all platforms × frameworks', () => {
  for (const platform of PLATFORMS) {
    for (const framework of FRAMEWORKS) {
      qaItAuto(`${platform} / ${framework} / upload`, () => {
        const result = generateCiTemplate({
          platform,
          framework,
          ingestPath: 'upload',
          projectKey: 'AUTH',
        });

        expect(result.platform).toBe(platform);
        expect(result.framework).toBe(framework);
        expect(result.ingestPath).toBe('upload');
        expect(result.filename).toBe(EXPECTED_FILENAMES[platform](framework));
        expect(result.content).toMatch(/npx @ai-testing-tool\/forge-api-client/);
        expect(result.content).not.toMatch(/Bearer\s+\S+/);
        expect(result.content).not.toMatch(/ai-testing-tool-upload\.js/);
        expect(result.secretsSetup.length >= 2).toBeTruthy();
        expect(result.variablesSetup.length >= 1).toBeTruthy();
        expect(result.variablesSetup.some((v) => v.name === 'AI_TESTING_TOOL_PLAN_NAME')).toBeTruthy();
        expect(result.variablesSetup.some((v) => v.name === 'AI_TESTING_TOOL_FIX_VERSION')).toBeTruthy();

        if (framework === 'vitest') {
          expect(result.content).toMatch(/npx vitest run --reporter=json --outputFile=ai-testing-tool-results\.json/);
        } else if (framework === 'jest') {
          expect(result.content).toMatch(/npx jest --json --outputFile=ai-testing-tool-results\.json/);
        } else {
          expect(result.content).toMatch(/npx playwright test --reporter=json/);
          expect(result.content).toMatch(/npx playwright install --with-deps/);
        }
      });
    }
  }
});

qaDescribe('generateCiTemplate — Vitest upload snapshots (proposal §5)', () => {
  qaItAuto('§5.1 GitHub', () => {
    const { content, filename } = generateCiTemplate({
      platform: 'github',
      framework: 'vitest',
      ingestPath: 'upload',
      projectKey: 'AUTH',
    });
    expect(filename).toBe('.github/workflows/ai-testing-tool-vitest.yml');
    expect(content).toBe(`name: AiTestingTool Vitest

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
      - run: npx vitest run --reporter=json --outputFile=ai-testing-tool-results.json
      - name: Upload to AiTestingTool
        if: always()
        env:
          AI_TESTING_TOOL_INGEST_URL: \${{ secrets.AI_TESTING_TOOL_INGEST_URL }}
          AI_TESTING_TOOL_INGEST_TOKEN: \${{ secrets.AI_TESTING_TOOL_INGEST_TOKEN }}
        run: |
          npx @ai-testing-tool/forge-api-client \\
            --project "\${{ vars.JIRA_PROJECT_KEY }}" \\
            --launch "\${{ github.workflow }} #\${{ github.run_number }}" \\
            --report ai-testing-tool-results.json
`,);
  });

  qaItAuto('§5.2 GitLab', () => {
    const { content, filename } = generateCiTemplate({
      platform: 'gitlab',
      framework: 'vitest',
      ingestPath: 'upload',
      projectKey: 'AUTH',
    });
    expect(filename).toBe('.gitlab-ci.yml');
    expect(content).toMatch(/# AiTestingTool fragment/);
    expect(content).toMatch(/when: always/);
    expect(content).toMatch(/needs: \[vitest\]/);
    expect(content).toMatch(/--project "\$JIRA_PROJECT_KEY"/);
    expect(content).toMatch(/--launch "\$CI_PIPELINE_ID"/);
    expect(content).toBe(`# AiTestingTool fragment — merge into your .gitlab-ci.yml
# Vitest upload path
stages:
  - test
  - report

vitest:
  stage: test
  image: node:22-alpine
  script:
    - npm ci
    - npx vitest run --reporter=json --outputFile=ai-testing-tool-results.json
  artifacts:
    when: always
    paths:
      - ai-testing-tool-results.json

ai-testing-tool_upload:
  stage: report
  image: node:22-alpine
  when: always
  needs: [vitest]
  variables:
    AI_TESTING_TOOL_INGEST_URL: $AI_TESTING_TOOL_INGEST_URL
    AI_TESTING_TOOL_INGEST_TOKEN: $AI_TESTING_TOOL_INGEST_TOKEN
  script:
    - |
      npx @ai-testing-tool/forge-api-client \\
        --project "$JIRA_PROJECT_KEY" \\
        --launch "$CI_PIPELINE_ID" \\
        --report ai-testing-tool-results.json
`,);
  });

  qaItAuto('§5.3 Jenkins', () => {
    const { content, filename } = generateCiTemplate({
      platform: 'jenkins',
      framework: 'vitest',
      ingestPath: 'upload',
      projectKey: 'AUTH',
    });
    expect(filename).toBe('Jenkinsfile');
    expect(content).toMatch(/withCredentials/);
    expect(content).toMatch(/credentialsId: 'ai-testing-tool-ingest-url'/);
    expect(content).toMatch(/JIRA_PROJECT_KEY = 'AUTH'/);
    expect(content).toBe(`// AiTestingTool fragment — Vitest upload path — merge into your Jenkinsfile
pipeline {
  agent any
  environment {
    JIRA_PROJECT_KEY = 'AUTH'
  }
  stages {
    stage('Test') {
      steps {
        sh 'npm ci'
        sh -c 'npx vitest run --reporter=json --outputFile=ai-testing-tool-results.json'
      }
    }
  }
  post {
    always {
      withCredentials([
        string(credentialsId: 'ai-testing-tool-ingest-url', variable: 'AI_TESTING_TOOL_INGEST_URL'),
        string(credentialsId: 'ai-testing-tool-ingest-token', variable: 'AI_TESTING_TOOL_INGEST_TOKEN'),
      ]) {
        sh '''
          npx @ai-testing-tool/forge-api-client \\
            --project "\${JIRA_PROJECT_KEY}" \\
            --launch "\${JOB_NAME} #\${BUILD_NUMBER}" \\
            --report ai-testing-tool-results.json
        '''
      }
    }
  }
}
`,);
  });

  qaItAuto('§5.4 Bitbucket', () => {
    const { content, filename } = generateCiTemplate({
      platform: 'bitbucket',
      framework: 'vitest',
      ingestPath: 'upload',
      projectKey: 'AUTH',
    });
    expect(filename).toBe('bitbucket-pipelines.yml');
    expect(content).toBe(`# AiTestingTool fragment — merge into your bitbucket-pipelines.yml
# Vitest upload path — set secured vars AI_TESTING_TOOL_INGEST_URL / AI_TESTING_TOOL_INGEST_TOKEN
image: node:22

pipelines:
  default:
    - step:
        name: Test
        caches:
          - node
        script:
          - npm ci
          - npx vitest run --reporter=json --outputFile=ai-testing-tool-results.json
        artifacts:
          - ai-testing-tool-results.json
    - step:
        name: Upload AiTestingTool
        script:
          - |
            npx @ai-testing-tool/forge-api-client \\
              --project "$JIRA_PROJECT_KEY" \\
              --launch "build-$BITBUCKET_BUILD_NUMBER" \\
              --report ai-testing-tool-results.json
`,);
  });

  qaItAuto('§5.5 Azure DevOps', () => {
    const { content, filename } = generateCiTemplate({
      platform: 'azure-devops',
      framework: 'vitest',
      ingestPath: 'upload',
      projectKey: 'AUTH',
    });
    expect(filename).toBe('azure-pipelines.yml');
    expect(content).toBe(`# AiTestingTool fragment — Vitest upload path
trigger:
  - main

pool:
  vmImage: ubuntu-latest

variables:
  - group: ai-testing-tool-secrets   # AI_TESTING_TOOL_INGEST_URL, AI_TESTING_TOOL_INGEST_TOKEN
  - name: JiraProjectKey
    value: AUTH

steps:
  - task: NodeTool@0
    inputs:
      versionSpec: '22.x'
    displayName: Use Node.js 22

  - script: npm ci
    displayName: Install dependencies

  - script: npx vitest run --reporter=json --outputFile=ai-testing-tool-results.json
    displayName: Run Vitest

  - script: |
      npx @ai-testing-tool/forge-api-client \\
        --project "$(JiraProjectKey)" \\
        --launch "$(Build.DefinitionName) #$(Build.BuildNumber)" \\
        --report ai-testing-tool-results.json
    displayName: Upload to AiTestingTool
    condition: always()
    env:
      AI_TESTING_TOOL_INGEST_URL: $(AI_TESTING_TOOL_INGEST_URL)
      AI_TESTING_TOOL_INGEST_TOKEN: $(AI_TESTING_TOOL_INGEST_TOKEN)
`,);
  });
});

qaDescribe('reporter path (@ai-testing-tool/forge-vitest / @ai-testing-tool/forge-jest / @ai-testing-tool/forge-mocha / @ai-testing-tool/forge-cucumberjs / @ai-testing-tool/forge-cypress / @ai-testing-tool/forge-playwright / @ai-testing-tool/forge-wdio)', () => {
  for (const platform of PLATFORMS) {
    for (const framework of REPORTER_FRAMEWORKS) {
      qaItAuto(`${platform} / ${framework} / reporter`, () => {
        const result = generateCiTemplate({
          platform,
          framework,
          ingestPath: 'reporter',
          projectKey: 'AUTH',
        });
        expect(result.ingestPath).toBe('reporter');
        expect(result.framework).toBe(framework);
        expect(result.content).toMatch(/AI_TESTING_TOOL_MODE/);
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
        expect(result.content).toMatch(runPattern);
        if (framework === 'playwright') {
          expect(result.content).toMatch(/npx playwright install --with-deps/);
          expect(result.content).toMatch(/@ai-testing-tool\/forge-playwright/);
        }
        if (framework === 'wdio') {
          expect(result.content).toMatch(/@ai-testing-tool\/forge-wdio/);
          expect(result.content).toMatch(/headless Chrome/);
        }
        if (framework === 'mocha') {
          expect(result.content).toMatch(/@ai-testing-tool\/forge-mocha/);
          expect(result.content).toMatch(/\.mocharc\.js/);
        }
        if (framework === 'cucumberjs') {
          expect(result.content).toMatch(/@ai-testing-tool\/forge-cucumberjs/);
          expect(result.content).toMatch(/cucumber\.js/);
        }
        expect(result.content).not.toMatch(/@ai-testing-tool\/forge-api-client/);
        expect(result.content).not.toMatch(/Bearer\s+\S+/i);
        expect(result.variablesSetup.some((v) => v.name === 'AI_TESTING_TOOL_PLAN_NAME')).toBeTruthy();
        expect(result.variablesSetup.some((v) => v.name === 'AI_TESTING_TOOL_FIX_VERSION')).toBeTruthy();
      });
    }
  }

  qaItAuto('rejects Cypress upload path', () => {
    expect(() =>
        generateCiTemplate({
          platform: 'github',
          framework: 'cypress',
          ingestPath: 'upload',
          projectKey: 'AUTH',
        })).toThrow(/Unsupported CI template variant/);
  });

  qaItAuto('rejects WDIO upload path', () => {
    expect(() =>
        generateCiTemplate({
          platform: 'github',
          framework: 'wdio',
          ingestPath: 'upload',
          projectKey: 'AUTH',
        })).toThrow(/Unsupported CI template variant/);
  });

  qaItAuto('rejects Mocha upload path', () => {
    expect(() =>
        generateCiTemplate({
          platform: 'github',
          framework: 'mocha',
          ingestPath: 'upload',
          projectKey: 'AUTH',
        })).toThrow(/Unsupported CI template variant/);
  });

  qaItAuto('rejects CucumberJS upload path', () => {
    expect(() =>
        generateCiTemplate({
          platform: 'github',
          framework: 'cucumberjs',
          ingestPath: 'upload',
          projectKey: 'AUTH',
        })).toThrow(/Unsupported CI template variant/);
  });

  qaItAuto('supports Playwright upload JSON path', () => {
    const result = generateCiTemplate({
      platform: 'github',
      framework: 'playwright',
      ingestPath: 'upload',
      projectKey: 'AUTH',
    });
    expect(result.content).toMatch(/npx playwright test --reporter=json/);
    expect(result.content).toMatch(/npx playwright install --with-deps/);
    expect(result.content).toMatch(/@ai-testing-tool\/forge-api-client/);
    expect(result.content).not.toMatch(/Bearer\s+\S+/i);
  });
});

qaDescribe('vitestJsonRun', () => {
  qaItAuto('builds the Vitest JSON reporter command', () => {
    expect(vitestJsonRun('out.json')).toBe('npx vitest run --reporter=json --outputFile=out.json',);
  });
});
