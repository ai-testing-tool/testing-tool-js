import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import {
  ModeEnum,
  QAnalyzerReporter,
  type IngestPayload,
} from 'qa-javascript-commons';

import { QA_METADATA_CONTENT_TYPE } from '../metadata-manager.js';
import { PlaywrightQaReporter } from '../reporter.js';
import { toJestJsonReport } from '../report-builder.js';

describe('mode=file publish', () => {
  it('writes FR41 payload with format jest-json', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'qa-playwright-'));
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
            name: 'test/login.spec.js',
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
        (written.report as { testResults?: Array<{ assertionResults?: Array<{ title?: string }> }> })
          .testResults?.[0]?.assertionResults?.[0]?.title,
        'AUTH-101 login',
      );
    } finally {
      QAnalyzerReporter.resetInstance();
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('PlaywrightQaReporter modes', () => {
  it('mode=off completes without credentials', async () => {
    const reporter = new PlaywrightQaReporter({ mode: ModeEnum.off });
    reporter.onBegin({} as never, {} as never);
    reporter.onTestEnd(
      {
        title: 'AUTH-101',
        titlePath: () => ['Login', 'AUTH-101'],
        location: { file: '/t.spec.js', line: 1, column: 1 },
      } as never,
      { status: 'passed', duration: 1, errors: [], steps: [], attachments: [] } as never,
    );
    await reporter.onEnd({} as never);
  });

  it('mode=file via reporter writes payload with native steps', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'qa-pw-rep-'));
    const out = join(dir, 'out.json');

    try {
      const reporter = new PlaywrightQaReporter({
        mode: ModeEnum.file,
        projectKey: 'AUTH',
        file: { path: out },
      });

      reporter.onBegin({} as never, {} as never);
      reporter.onTestEnd(
        {
          title: 'AUTH-101 login',
          titlePath: () => ['Login Scenarios', 'AUTH-101 login'],
          location: { file: '/test/login.spec.js', line: 10, column: 1 },
        } as never,
        {
          status: 'passed',
          duration: 50,
          errors: [],
          steps: [
            {
              category: 'test.step',
              title: 'Fill in username',
              steps: [],
            },
            {
              category: 'test.step',
              title: 'Submit',
              steps: [],
            },
          ],
          attachments: [
            {
              name: 'qanalyzer-metadata.json',
              contentType: QA_METADATA_CONTENT_TYPE,
              body: Buffer.from(
                JSON.stringify({ suite: 'E-commerce\tLogin' }),
                'utf8',
              ),
            },
          ],
        } as never,
      );
      await reporter.onEnd({} as never);

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
      const qa = assertion?.meta?.qa as {
        framework?: string;
        steps?: Array<{ name: string }>;
        suite?: Array<{ title: string }>;
      };
      assert.equal(qa?.framework, 'playwright');
      assert.equal(qa?.steps?.length, 2);
      assert.deepEqual(qa?.suite, [{ title: 'E-commerce' }, { title: 'Login' }]);
    } finally {
      QAnalyzerReporter.resetInstance();
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
