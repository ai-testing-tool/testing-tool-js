"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isStillImageAttachment = isStillImageAttachment;
exports.enrichAssertionWithFailureScreenshots = enrichAssertionWithFailureScreenshots;
/**
 * Upload Playwright still-image attachments on failure (FR119).
 * Skips video/trace; never throws into the test run.
 */
const forge_commons_1 = require("@ai-testing-tool/forge-commons");
const metadata_manager_1 = require("./metadata-manager");
function ensureQaMeta(assertion) {
    if (!assertion.meta)
        assertion.meta = {};
    if (!assertion.meta.qa) {
        assertion.meta.qa = {
            framework: 'playwright',
            host: { framework: 'playwright', reporter: '@ai-testing-tool/forge-playwright' },
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
/** Prefer PNG / still images; skip video, trace, and AiTestingTool metadata JSON. */
function isStillImageAttachment(att) {
    const ct = (att.contentType ?? '').toLowerCase();
    if (ct === metadata_manager_1.QA_METADATA_CONTENT_TYPE)
        return false;
    if (ct.startsWith('video/') || ct.includes('trace') || ct.includes('zip')) {
        return false;
    }
    if (ct === 'image/png' || ct === 'image/jpeg' || ct === 'image/webp') {
        return true;
    }
    if (ct.startsWith('image/'))
        return true;
    const name = (att.name ?? '').toLowerCase();
    if (name === 'screenshot' || /\.(png|jpe?g|webp)$/i.test(name))
        return true;
    if (att.path && /\.(png|jpe?g|webp)$/i.test(att.path))
        return true;
    return false;
}
function mimeFor(att) {
    if (att.contentType && att.contentType !== 'application/octet-stream') {
        return att.contentType;
    }
    const name = att.name || att.path || '';
    if (/\.jpe?g$/i.test(name))
        return 'image/jpeg';
    if (/\.webp$/i.test(name))
        return 'image/webp';
    return 'image/png';
}
/**
 * Upload still-image attachments for a failed test onto assertion meta.qa.
 */
async function enrichAssertionWithFailureScreenshots(assertion, attachments) {
    if (assertion.status !== 'failed')
        return;
    for (const att of attachments ?? []) {
        if (!isStillImageAttachment(att))
            continue;
        try {
            const fileName = att.name ||
                att.path?.split(/[/\\]/).pop() ||
                'screenshot.png';
            const outcome = await (0, forge_commons_1.uploadAttachmentForQa)({
                fileName,
                mimeType: mimeFor(att),
                content: att.body,
                path: att.path,
                issueKeySources: [assertion.title, assertion.fullName],
            });
            pushAttachment(assertion, outcome.attachment);
        }
        catch {
            // Never fail the Playwright run
        }
    }
}
