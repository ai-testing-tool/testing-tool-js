import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  enrichAssertionWithFailureScreenshots,
  isStillImageAttachment,
} from '../enrich-screenshots.js';
import type { PlaywrightAssertionInput } from '../report-builder.js';

describe('Playwright failure screenshot enrich (FR119)', () => {
  it('isStillImageAttachment accepts png and rejects video', () => {
    assert.equal(
      isStillImageAttachment({
        name: 'screenshot',
        contentType: 'image/png',
      }),
      true,
    );
    assert.equal(
      isStillImageAttachment({
        name: 'video',
        contentType: 'video/webm',
      }),
      false,
    );
  });

  it('uploads metadata for failed test png body (no attach URL → no content_ref)', async () => {
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
    assert.equal(atts.length, 1);
    assert.equal(atts[0]!.file_name, 'screenshot');
    assert.equal(atts[0]!.mime_type, 'image/png');
    assert.equal(atts[0]!.size, 48);
    assert.equal(atts[0]!.content_ref, undefined);
  });

  it('skips uploads for passed tests', async () => {
    const assertion: PlaywrightAssertionInput = {
      ancestorTitles: [],
      title: 'AUTH-101 ok',
      status: 'passed',
    };
    await enrichAssertionWithFailureScreenshots(assertion, [
      { name: 'screenshot', contentType: 'image/png', body: Buffer.alloc(8) },
    ]);
    assert.equal(assertion.meta?.qa?.attachments, undefined);
  });
});
