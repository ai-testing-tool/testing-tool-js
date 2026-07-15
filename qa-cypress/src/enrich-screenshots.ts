/**
 * Enrich failed Cypress assertions with Forge-uploaded still-image screenshots (FR71).
 * Never throws — skipped / failed uploads still allow the run to finish.
 */
import {
  type QaMetaAttachmentWire,
  type QaMetaWire,
  uploadAttachmentForQa,
} from 'qa-forge-commons';

import type { CypressAssertionInput, CypressSpecInput } from './report-builder';
import {
  ScreenshotsManager,
  isStillImagePath,
  matchScreenshotToAssertion,
  nextUnusedSpecScreenshot,
  type CypressScreenshotRecord,
} from './screenshots-manager';

function ensureQaMeta(assertion: CypressAssertionInput): QaMetaWire {
  if (!assertion.meta) assertion.meta = {};
  if (!assertion.meta.qa) {
    assertion.meta.qa = {
      framework: 'cypress',
      host: { framework: 'cypress', reporter: 'qa-forge-cypress' },
    };
  }
  return assertion.meta.qa;
}

function pushAttachment(
  assertion: CypressAssertionInput,
  attachment: QaMetaAttachmentWire,
): void {
  const qa = ensureQaMeta(assertion);
  if (!qa.attachments) qa.attachments = [];
  qa.attachments.push(attachment);
}

async function uploadShot(
  shot: CypressScreenshotRecord,
  assertion: CypressAssertionInput,
): Promise<void> {
  try {
    if (!isStillImagePath(shot.path)) return;
    const fileName = shot.path.split(/[/\\]/).pop() ?? 'screenshot.png';
    const mimeType = /\.jpe?g$/i.test(fileName)
      ? 'image/jpeg'
      : /\.webp$/i.test(fileName)
        ? 'image/webp'
        : 'image/png';

    const outcome = await uploadAttachmentForQa({
      path: shot.path,
      fileName,
      mimeType,
      issueKeySources: [assertion.title, assertion.fullName],
    });
    pushAttachment(assertion, outcome.attachment);
  } catch {
    // Never fail the Cypress run
  }
}

/**
 * For each failed assertion, upload a matching still-image screenshot if available.
 * Each screenshot is consumed at most once.
 */
export async function enrichSpecsWithFailureScreenshots(
  specs: CypressSpecInput[],
  screenshotsPath?: string,
): Promise<void> {
  const shots = ScreenshotsManager.getAll(
    ScreenshotsManager.resolvePath(screenshotsPath),
  ).filter((s) => s.testFailure !== false && isStillImagePath(s.path));

  const used = new Set<number>();

  for (const spec of specs) {
    for (const assertion of spec.assertions) {
      if (assertion.status !== 'failed') continue;

      let idx = shots.findIndex(
        (s, i) =>
          !used.has(i) && matchScreenshotToAssertion(s, assertion, spec.name),
      );

      // Fallback: next unused failure screenshot for this spec (order-preserved)
      if (idx < 0) {
        idx = nextUnusedSpecScreenshot(shots, used, spec.name);
      }
      if (idx < 0) continue;

      used.add(idx);
      await uploadShot(shots[idx]!, assertion);
    }
  }
}
