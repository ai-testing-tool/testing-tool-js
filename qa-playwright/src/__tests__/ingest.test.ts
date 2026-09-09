import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { qaDescribe, qaItAuto, expect } from '@qa/test';

import {
  ModeEnum,
  AiTestingToolReporter,
  type IngestPayload,
} from '@ai-testing-tool/forge-commons';

import { QA_METADATA_CONTENT_TYPE } from '../metadata-manager.js';
import { PlaywrightQaReporter } from '../reporter.js';
import { toJestJsonReport } from '../report-builder.js';

qaDescribe('mode=file publish', () => {
  qaItAuto('writes FR41 payload with format jest-json', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'qa-playwright-'));
    const out = join(dir, 'ai-testing-tool-results.json');

    try {
      AiTestingToolReporter.resetInstance();
      const reporter = AiTestingToolReporter.getInstance({
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

      expect(payload).toBeTruthy();
      expect(payload.format).toBe('jest-json');

      const written = JSON.parse(readFileSync(out, 'utf8')) as IngestPayload;
      expect(written.projectKey).toBe('AUTH');
      expect((written.report as { testResults?: Array<{ assertionResults?: Array<{ title?: string }> }> })
          .testResults?.[0]?.assertionResults?.[0]?.title).toBe('AUTH-101 login',);
    } finally {
      AiTestingToolReporter.resetInstance();
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

qaDescribe('PlaywrightQaReporter modes', () => {
  qaItAuto('mode=off completes without credentials', async () => {
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

  qaItAuto('mode=file via reporter writes payload with native steps', async () => {
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
              name: 'ai-testing-tool-metadata.json',
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
      expect(written.format).toBe('jest-json');
      expect(written.projectKey).toBe('AUTH');
      const report = written.report as {
        testResults?: Array<{
          assertionResults?: Array<{
            title?: string;
            meta?: { qa?: Record<string, unknown> };
          }>;
        }>;
      };
      const assertion = report.testResults?.[0]?.assertionResults?.[0];
      expect(assertion?.title).toBe('AUTH-101 login');
      const qa = assertion?.meta?.qa as {
        framework?: string;
        steps?: Array<{ name: string }>;
        suite?: Array<{ title: string }>;
      };
      expect(qa?.framework).toBe('playwright');
      expect(qa?.steps?.length).toBe(2);
      expect(qa?.suite).toEqual([{ title: 'E-commerce' }, { title: 'Login' }]);
    } finally {
      AiTestingToolReporter.resetInstance();
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
