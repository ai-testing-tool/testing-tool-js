import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import {
  ModeEnum,
  QAnalyzerReporter,
  type IngestPayload,
} from '@qanalyzer/forge-commons';

import { MetadataManager, qa } from '../helpers.js';
import {
  afterRunHook,
  beforeRunHook,
  hooksLifecycle,
} from '../hooks.js';
import { QaWdioReporter } from '../reporter.js';
import { toJestJsonReport } from '../report-builder.js';
import { ResultsBuffer } from '../results-buffer.js';

describe('mode=file publish', () => {
  it('writes FR41 payload with format jest-json', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'qa-wdio-'));
    const out = join(dir, 'qanalyzer-results.json');

    try {
      QAnalyzerReporter.resetInstance();
      const reporter = QAnalyzerReporter.getInstance({
        mode: ModeEnum.file,
        projectKey: 'AUTH',
        launchName: 'local',
        file: { path: out },
      });

      const payload = await reporter.publishReport(
        toJestJsonReport([
          {
            name: 'test/specs/login.spec.js',
            assertions: [
              {
                ancestorTitles: ['Login'],
                title: 'AUTH-101 login',
                status: 'passed',
                duration: 12,
              },
            ],
          },
        ]),
        { format: 'jest-json' },
      );

      assert.ok(payload);
      assert.equal(payload.format, 'jest-json');

      const written = JSON.parse(readFileSync(out, 'utf8')) as IngestPayload;
      assert.equal(written.projectKey, 'AUTH');
      assert.equal(
        (
          written.report as {
            testResults?: Array<{
              assertionResults?: Array<{ title?: string }>;
            }>;
          }
        ).testResults?.[0]?.assertionResults?.[0]?.title,
        'AUTH-101 login',
      );
    } finally {
      QAnalyzerReporter.resetInstance();
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('QaWdioReporter modes', () => {
  it('mode=off completes without credentials', async () => {
    QAnalyzerReporter.resetInstance();
    hooksLifecycle.reset();
    ResultsBuffer.reset({ mode: ModeEnum.off });

    await beforeRunHook({ mode: ModeEnum.off });
    const reporter = new QaWdioReporter({ mode: ModeEnum.off });
    reporter.onTestStart({ title: 'AUTH-101' } as never);
    reporter.onTestPass({
      title: 'AUTH-101',
      parent: 'Login',
      duration: 1,
      errors: [],
    } as never);
    await reporter.onRunnerEnd();
    await afterRunHook();
  });

  it('mode=file via reporter writes payload with qa.step hierarchy', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'qa-wdio-rep-'));
    const out = join(dir, 'out.json');

    try {
      QAnalyzerReporter.resetInstance();
      hooksLifecycle.reset();
      ResultsBuffer.reset();

      await beforeRunHook({
        mode: ModeEnum.file,
        projectKey: 'AUTH',
        file: { path: out },
      });

      const reporter = new QaWdioReporter({
        mode: ModeEnum.file,
        projectKey: 'AUTH',
        file: { path: out },
      });

      reporter.onSuiteStart({
        uid: 's1',
        title: 'Login Scenarios',
        file: '/test/specs/login.spec.js',
      } as never);

      reporter.onTestStart({ title: 'AUTH-101 login' } as never);
      MetadataManager.clear();
      qa.suite('E-commerce\tLogin');
      await qa.step('Fill credentials', async (step) => {
        await step.step('Submit', async () => {
          // nested
        });
      });

      reporter.onTestPass({
        title: 'AUTH-101 login',
        parent: 'Login Scenarios',
        duration: 50,
        errors: [],
        file: '/test/specs/login.spec.js',
      } as never);

      await reporter.onRunnerEnd();
      await afterRunHook();

      const written = JSON.parse(readFileSync(out, 'utf8')) as IngestPayload;
      assert.equal(written.format, 'jest-json');
      assert.equal(written.projectKey, 'AUTH');
      const report = written.report as {
        testResults?: Array<{
          assertionResults?: Array<{
            title?: string;
            meta?: { qa?: Record<string, unknown> };
          }>;
        }>;
      };
      const assertion = report.testResults?.[0]?.assertionResults?.[0];
      assert.equal(assertion?.title, 'AUTH-101 login');
      const qaMeta = assertion?.meta?.qa as {
        framework?: string;
        steps?: Array<{ name: string }>;
        suite?: Array<{ title: string }>;
      };
      assert.equal(qaMeta?.framework, 'wdio');
      assert.equal(qaMeta?.steps?.length, 2);
      assert.deepEqual(qaMeta?.suite, [
        { title: 'E-commerce' },
        { title: 'Login' },
      ]);
    } finally {
      QAnalyzerReporter.resetInstance();
      hooksLifecycle.reset();
      ResultsBuffer.reset();
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
