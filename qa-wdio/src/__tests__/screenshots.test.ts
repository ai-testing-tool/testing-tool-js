import { qaDescribe, qaItAuto, expect } from '@qa/test';

import { enrichSpecsWithFailureScreenshots } from '../enrich-screenshots.js';
import { FailureScreenshotBuffer } from '../failure-screenshot-buffer.js';
import type { WdioSpecInput } from '../report-builder.js';
import { QaWdioService } from '../service.js';

qaDescribe('WDIO failure screenshot enrich (FR133)', () => {
  qaItAuto('merges buffered screenshots onto failed assertions', () => {
    FailureScreenshotBuffer.clear();
    FailureScreenshotBuffer.add('AUTH-101 fails', {
      file_name: 'screenshot.png',
      mime_type: 'image/png',
      size: 12,
    });

    const specs: WdioSpecInput[] = [
      {
        name: 'test/spec.js',
        assertions: [
          {
            ancestorTitles: [],
            title: 'AUTH-101 fails',
            status: 'failed',
            failureMessages: ['x'],
          },
        ],
      },
    ];

    enrichSpecsWithFailureScreenshots(specs);
    const att = specs[0]!.assertions[0]!.meta?.qa?.attachments?.[0];
    expect(att).toBeTruthy();
    expect(att!.file_name).toBe('screenshot.png');
    expect(att!.mime_type).toBe('image/png');
    expect(FailureScreenshotBuffer.size()).toBe(0);
  });

  qaItAuto('service afterTest captures screenshot when enabled', async () => {
    FailureScreenshotBuffer.clear();
    const service = new QaWdioService({
      disableWebdriverScreenshotsReporting: false,
    });

    const g = globalThis as { browser?: { takeScreenshot: () => Promise<string> } };
    const prev = g.browser;
    g.browser = {
      takeScreenshot: async () => Buffer.from('png-bytes').toString('base64'),
    };

    try {
      await service.afterTest(
        { title: 'AUTH-202 fails' },
        {},
        { passed: false },
      );
      expect(FailureScreenshotBuffer.size()).toBe(1);
      const shots = FailureScreenshotBuffer.takeForTitle('AUTH-202 fails');
      expect(shots[0]!.file_name).toBe('screenshot.png');
      expect(shots[0]!.mime_type).toBe('image/png');
      expect(shots[0]!.content_ref).toBeUndefined();
    } finally {
      g.browser = prev;
      FailureScreenshotBuffer.clear();
    }
  });

  qaItAuto('service afterScenario captures screenshot on cucumber failure', async () => {
    FailureScreenshotBuffer.clear();
    const service = new QaWdioService({
      disableWebdriverScreenshotsReporting: false,
    });

    const g = globalThis as { browser?: { takeScreenshot: () => Promise<string> } };
    const prev = g.browser;
    g.browser = {
      takeScreenshot: async () => Buffer.from('png-bytes').toString('base64'),
    };

    try {
      await service.afterScenario(
        { passed: false },
        { passed: false },
        { title: 'AUTH-303 scenario', tags: [{ name: '@AUTH-303' }] },
      );
      expect(FailureScreenshotBuffer.size()).toBe(1);
      const shots = FailureScreenshotBuffer.takeForTitle('AUTH-303 scenario');
      expect(shots[0]!.file_name).toBe('screenshot.png');
    } finally {
      g.browser = prev;
      FailureScreenshotBuffer.clear();
    }
  });
});
