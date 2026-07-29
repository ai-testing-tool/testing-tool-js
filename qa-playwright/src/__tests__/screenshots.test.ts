import { qaDescribe, qaItAuto, expect } from '@qa/test';

import {
  enrichAssertionWithFailureScreenshots,
  isStillImageAttachment,
} from '../enrich-screenshots.js';
import type { PlaywrightAssertionInput } from '../report-builder.js';

qaDescribe('Playwright failure screenshot enrich (FR119)', () => {
  qaItAuto('isStillImageAttachment accepts png and rejects video', () => {
    expect(isStillImageAttachment({
        name: 'screenshot',
        contentType: 'image/png',
      })).toBe(true);
    expect(isStillImageAttachment({
        name: 'video',
        contentType: 'video/webm',
      })).toBe(false);
  });

  qaItAuto('uploads metadata for failed test png body (no attach URL → no content_ref)', async () => {
    const assertion: PlaywrightAssertionInput = {
      ancestorTitles: ['Suite'],
      title: 'AUTH-101 fails',
      fullName: 'Suite AUTH-101 fails',
      status: 'failed',
      failureMessages: ['err'],
    };

    await enrichAssertionWithFailureScreenshots(assertion, [
      {
        name: 'screenshot',
        contentType: 'image/png',
        body: Buffer.alloc(48, 2),
      },
      {
        name: 'video',
        contentType: 'video/webm',
        body: Buffer.alloc(48, 3),
      },
    ]);

    const atts = assertion.meta?.qa?.attachments ?? [];
    expect(atts.length).toBe(1);
    expect(atts[0]!.file_name).toBe('screenshot');
    expect(atts[0]!.mime_type).toBe('image/png');
    expect(atts[0]!.size).toBe(48);
    expect(atts[0]!.content_ref).toBeUndefined();
  });

  qaItAuto('skips uploads for passed tests', async () => {
    const assertion: PlaywrightAssertionInput = {
      ancestorTitles: [],
      title: 'AUTH-101 ok',
      status: 'passed',
    };
    await enrichAssertionWithFailureScreenshots(assertion, [
      { name: 'screenshot', contentType: 'image/png', body: Buffer.alloc(8) },
    ]);
    expect(assertion.meta?.qa?.attachments).toBeUndefined();
  });
});
