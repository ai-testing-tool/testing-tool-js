/**
 * Upload Playwright still-image attachments on failure (FR119).
 * Skips video/trace; never throws into the test run.
 */
import {
  type QaMetaAttachmentWire,
  type QaMetaWire,
  uploadAttachmentForQa,
} from 'qa-javascript-commons';

import { QA_METADATA_CONTENT_TYPE } from './metadata-manager';
import type { PlaywrightAssertionInput } from './report-builder';

export type PlaywrightMediaAttachment = {
  name: string;
  contentType: string;
  body?: Buffer | string;
  path?: string;
};

function ensureQaMeta(assertion: PlaywrightAssertionInput): QaMetaWire {
  if (!assertion.meta) assertion.meta = {};
  if (!assertion.meta.qa) {
    assertion.meta.qa = {
      framework: 'playwright',
      host: { framework: 'playwright', reporter: 'qa-playwright' },
    };
  }
  return assertion.meta.qa;
}

function pushAttachment(
  assertion: PlaywrightAssertionInput,
  attachment: QaMetaAttachmentWire,
): void {
  const qa = ensureQaMeta(assertion);
  if (!qa.attachments) qa.attachments = [];
  qa.attachments.push(attachment);
}

/** Prefer PNG / still images; skip video, trace, and QAnalyzer metadata JSON. */
export function isStillImageAttachment(att: PlaywrightMediaAttachment): boolean {
  const ct = (att.contentType ?? '').toLowerCase();
  if (ct === QA_METADATA_CONTENT_TYPE) return false;
  if (ct.startsWith('video/') || ct.includes('trace') || ct.includes('zip')) {
    return false;
  }
  if (ct === 'image/png' || ct === 'image/jpeg' || ct === 'image/webp') {
    return true;
  }
  if (ct.startsWith('image/')) return true;
  const name = (att.name ?? '').toLowerCase();
  if (name === 'screenshot' || /\.(png|jpe?g|webp)$/i.test(name)) return true;
  if (att.path && /\.(png|jpe?g|webp)$/i.test(att.path)) return true;
  return false;
}

function mimeFor(att: PlaywrightMediaAttachment): string {
  if (att.contentType && att.contentType !== 'application/octet-stream') {
    return att.contentType;
  }
  const name = att.name || att.path || '';
  if (/\.jpe?g$/i.test(name)) return 'image/jpeg';
  if (/\.webp$/i.test(name)) return 'image/webp';
  return 'image/png';
}

/**
 * Upload still-image attachments for a failed test onto assertion meta.qa.
 */
export async function enrichAssertionWithFailureScreenshots(
  assertion: PlaywrightAssertionInput,
  attachments: readonly PlaywrightMediaAttachment[] | undefined,
): Promise<void> {
  if (assertion.status !== 'failed') return;
  for (const att of attachments ?? []) {
    if (!isStillImageAttachment(att)) continue;
    try {
      const fileName =
        att.name ||
        att.path?.split(/[/\\]/).pop() ||
        'screenshot.png';
      const outcome = await uploadAttachmentForQa({
        fileName,
        mimeType: mimeFor(att),
        content: att.body,
        path: att.path,
        issueKeySources: [assertion.title, assertion.fullName],
      });
      pushAttachment(assertion, outcome.attachment);
    } catch {
      // Never fail the Playwright run
    }
  }
}
