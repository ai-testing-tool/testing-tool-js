"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildQaMetaFromResult = buildQaMetaFromResult;
const forge_commons_1 = require("@qanalyzer/forge-commons");
const metadata_manager_1 = require("./metadata-manager");
const step_extractor_1 = require("./step-extractor");
/**
 * Merge `qa.*` helper attachments + native `test.step` into `meta.qa`.
 */
function buildQaMetaFromResult(input) {
    const acc = (0, forge_commons_1.createQaMetaAccumulator)();
    for (const attachment of input.attachments ?? []) {
        if (attachment.contentType !== metadata_manager_1.QA_METADATA_CONTENT_TYPE)
            continue;
        if (attachment.body == null)
            continue;
        try {
            const raw = typeof attachment.body === 'string'
                ? attachment.body
                : attachment.body.toString('utf8');
            const message = JSON.parse(raw);
            if (message.title)
                (0, forge_commons_1.applyQaAnnotation)(acc, { type: 'qa-title', body: message.title });
            if (message.comment) {
                (0, forge_commons_1.applyQaAnnotation)(acc, { type: 'qa-comment', body: message.comment });
            }
            if (message.suite)
                (0, forge_commons_1.applyQaAnnotation)(acc, { type: 'qa-suite', body: message.suite });
            if (message.fields) {
                (0, forge_commons_1.applyQaAnnotation)(acc, { type: 'qa-fields', body: message.fields });
            }
            if (message.parameters) {
                (0, forge_commons_1.applyQaAnnotation)(acc, { type: 'qa-parameters', body: message.parameters });
            }
            if (message.issueKeys?.length) {
                (0, forge_commons_1.applyQaAnnotation)(acc, { type: 'qa-issue-keys', body: message.issueKeys });
            }
            if (message.ignore)
                (0, forge_commons_1.applyQaAnnotation)(acc, { type: 'qa-ignore', body: true });
            for (const att of message.attachments ?? []) {
                (0, forge_commons_1.applyQaAnnotation)(acc, {
                    type: 'qa-attach',
                    body: { name: att.name, contentType: att.contentType },
                });
            }
        }
        catch {
            // ignore malformed metadata
        }
    }
    const nativeSteps = (0, step_extractor_1.extractNativeSteps)(input.steps);
    for (const step of nativeSteps) {
        acc.steps.push({ name: step.name, status: step.status });
    }
    return (0, forge_commons_1.toQaMetaWire)(acc, { framework: 'playwright', reporter: '@qanalyzer/forge-playwright' });
}
