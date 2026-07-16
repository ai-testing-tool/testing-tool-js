/**
 * Merge buffered failure screenshots onto WDIO assertions before FR41 publish (FR133).
 */
import type { QaMetaWire } from '@qanalyzer/forge-commons';

import { FailureScreenshotBuffer } from './failure-screenshot-buffer';
import type { WdioAssertionInput, WdioSpecInput } from './report-builder';

function ensureQaMeta(assertion: WdioAssertionInput): QaMetaWire {
  if (!assertion.meta) assertion.meta = {};
  if (!assertion.meta.qa) {
    assertion.meta.qa = {
      framework: 'wdio',
      host: { framework: 'wdio', reporter: '@qanalyzer/forge-wdio' },
    };
  }
  return assertion.meta.qa;
}

export function enrichSpecsWithFailureScreenshots(
  specs: WdioSpecInput[],
): void {
  for (const spec of specs) {
    for (const assertion of spec.assertions) {
      if (assertion.status !== 'failed') continue;
      const shots = FailureScreenshotBuffer.takeForTitle(assertion.title);
      if (shots.length === 0) continue;
      const qa = ensureQaMeta(assertion);
      if (!qa.attachments) qa.attachments = [];
      qa.attachments.push(...shots);
    }
  }

  // Ordered fallback for any remaining shots vs remaining failed assertions
  const leftovers = FailureScreenshotBuffer.takeAll();
  if (leftovers.length === 0) return;

  let li = 0;
  for (const spec of specs) {
    for (const assertion of spec.assertions) {
      if (assertion.status !== 'failed' || li >= leftovers.length) continue;
      // Skip if already has a screenshot-like attach from takeForTitle
      const qa = ensureQaMeta(assertion);
      const hasShot = (qa.attachments ?? []).some(
        (a) =>
          a.mime_type?.startsWith('image/') ||
          /\.(png|jpe?g|webp)$/i.test(a.file_name ?? ''),
      );
      if (hasShot) continue;
      if (!qa.attachments) qa.attachments = [];
      qa.attachments.push(leftovers[li]!.attachment);
      li += 1;
    }
  }
}
