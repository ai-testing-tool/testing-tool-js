"use strict";
/**
 * Programmatic helpers for Jest tests (FR75 + Phase 3 attach upload FR83).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.qa = void 0;
exports.drainQaMeta = drainQaMeta;
const qa_forge_commons_1 = require("qa-forge-commons");
const localBuffer = [];
function pushMeta(type, body) {
    const entry = { type, body };
    if (globalThis.__QA_JEST_BRIDGE__) {
        globalThis.__QA_JEST_BRIDGE__.push(entry);
        return;
    }
    localBuffer.push(entry);
}
function drainQaMeta() {
    if (globalThis.__QA_JEST_BRIDGE__) {
        return globalThis.__QA_JEST_BRIDGE__.drain();
    }
    const copy = [...localBuffer];
    localBuffer.length = 0;
    return copy;
}
function currentTestTitle() {
    return globalThis.__QA_JEST_BRIDGE__?.currentTitle;
}
exports.qa = {
    async title(value) {
        pushMeta('qa-title', value);
    },
    async comment(value) {
        pushMeta('qa-comment', value);
    },
    async suite(value) {
        pushMeta('qa-suite', value);
    },
    async fields(values) {
        pushMeta('qa-fields', values);
    },
    async parameters(values) {
        pushMeta('qa-parameters', values);
    },
    ignore() {
        pushMeta('qa-ignore', true);
    },
    async step(name, body) {
        pushMeta('qa-step', name);
        try {
            await body();
            pushMeta('qa-step-end', { name, status: 'passed' });
        }
        catch (error) {
            pushMeta('qa-step-failed', { name, status: 'failed' });
            throw error;
        }
    },
    async attach(attach) {
        const mime = attach.contentType ?? attach.type;
        const outcome = await (0, qa_forge_commons_1.uploadAttachmentForQa)({
            fileName: attach.name,
            mimeType: mime,
            content: attach.content,
            path: attach.path,
            issueKey: attach.issueKey,
            issueKeySources: [attach.issueKey, currentTestTitle()],
        });
        pushMeta('qa-attach', {
            name: outcome.attachment.file_name ?? attach.name,
            contentType: outcome.attachment.mime_type ?? mime,
            size: outcome.attachment.size,
            content_ref: outcome.attachment.content_ref,
        });
    },
};
