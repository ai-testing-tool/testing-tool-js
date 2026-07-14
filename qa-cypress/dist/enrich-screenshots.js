"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enrichSpecsWithFailureScreenshots = enrichSpecsWithFailureScreenshots;
/**
 * Enrich failed Cypress assertions with Forge-uploaded still-image screenshots (FR71).
 * Never throws — skipped / failed uploads still allow the run to finish.
 */
const qa_javascript_commons_1 = require("qa-javascript-commons");
const screenshots_manager_1 = require("./screenshots-manager");
function ensureQaMeta(assertion) {
    if (!assertion.meta)
        assertion.meta = {};
    if (!assertion.meta.qa) {
        assertion.meta.qa = {
            framework: 'cypress',
            host: { framework: 'cypress', reporter: 'qa-cypress' },
        };
    }
    return assertion.meta.qa;
}
function pushAttachment(assertion, attachment) {
    const qa = ensureQaMeta(assertion);
    if (!qa.attachments)
        qa.attachments = [];
    qa.attachments.push(attachment);
}
async function uploadShot(shot, assertion) {
    try {
        if (!(0, screenshots_manager_1.isStillImagePath)(shot.path))
            return;
        const fileName = shot.path.split(/[/\\]/).pop() ?? 'screenshot.png';
        const mimeType = /\.jpe?g$/i.test(fileName)
            ? 'image/jpeg'
            : /\.webp$/i.test(fileName)
                ? 'image/webp'
                : 'image/png';
        const outcome = await (0, qa_javascript_commons_1.uploadAttachmentForQa)({
            path: shot.path,
            fileName,
            mimeType,
            issueKeySources: [assertion.title, assertion.fullName],
        });
        pushAttachment(assertion, outcome.attachment);
    }
    catch {
        // Never fail the Cypress run
    }
}
/**
 * For each failed assertion, upload a matching still-image screenshot if available.
 * Each screenshot is consumed at most once.
 */
async function enrichSpecsWithFailureScreenshots(specs, screenshotsPath) {
    const shots = screenshots_manager_1.ScreenshotsManager.getAll(screenshots_manager_1.ScreenshotsManager.resolvePath(screenshotsPath)).filter((s) => s.testFailure !== false && (0, screenshots_manager_1.isStillImagePath)(s.path));
    const used = new Set();
    for (const spec of specs) {
        for (const assertion of spec.assertions) {
            if (assertion.status !== 'failed')
                continue;
            let idx = shots.findIndex((s, i) => !used.has(i) && (0, screenshots_manager_1.matchScreenshotToAssertion)(s, assertion, spec.name));
            // Fallback: next unused failure screenshot for this spec (order-preserved)
            if (idx < 0) {
                idx = (0, screenshots_manager_1.nextUnusedSpecScreenshot)(shots, used, spec.name);
            }
            if (idx < 0)
                continue;
            used.add(idx);
            await uploadShot(shots[idx], assertion);
        }
    }
}
