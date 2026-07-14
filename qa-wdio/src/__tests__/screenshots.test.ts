import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { enrichSpecsWithFailureScreenshots } from '../enrich-screenshots.js';
import { FailureScreenshotBuffer } from '../failure-screenshot-buffer.js';
import type { WdioSpecInput } from '../report-builder.js';
import { QaWdioService } from '../service.js';

describe('WDIO failure screenshot enrich (FR133)', () => {
  it('merges buffered screenshots onto failed assertions', () => {
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
    assert.ok(att);
    assert.equal(att!.file_name, 'screenshot.png');
    assert.equal(att!.mime_type, 'image/png');
    assert.equal(FailureScreenshotBuffer.size(), 0);
  });

  it('service afterTest captures screenshot when enabled', async () => {
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
      assert.equal(FailureScreenshotBuffer.size(), 1);
      const shots = FailureScreenshotBuffer.takeForTitle('AUTH-202 fails');
      assert.equal(shots[0]!.file_name, 'screenshot.png');
      assert.equal(shots[0]!.mime_type, 'image/png');
      assert.equal(shots[0]!.content_ref, undefined);
    } finally {
      g.browser = prev;
      FailureScreenshotBuffer.clear();
    }
  });

  it('service afterScenario captures screenshot on cucumber failure', async () => {
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
      assert.equal(FailureScreenshotBuffer.size(), 1);
      const shots = FailureScreenshotBuffer.takeForTitle('AUTH-303 scenario');
      assert.equal(shots[0]!.file_name, 'screenshot.png');
    } finally {
      g.browser = prev;
      FailureScreenshotBuffer.clear();
    }
  });
});
