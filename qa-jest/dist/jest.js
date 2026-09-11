"use strict";
/**
 * Programmatic helpers for Jest tests (FR75 + Phase 3 attach upload FR83).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.qa = void 0;
exports.drainQaMeta = drainQaMeta;
const forge_commons_1 = require("@ai-testing-tool/forge-commons");
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
    async suiteId(value) {
        pushMeta('qa-suite-id', value);
    },
    async planId(value) {
        pushMeta('qa-plan-id', value);
    },
    async plan(value) {
        pushMeta('qa-plan', value);
    },
    async fixVersion(value) {
        pushMeta('qa-fix-version', value);
    },
    async sprintName(value) {
        pushMeta('qa-sprint-name', value);
    },
    async labels(value) {
        pushMeta('qa-labels', value);
    },
    async fields(values) {
        pushMeta('qa-fields', values);
    },
    async parameters(values) {
        pushMeta('qa-parameters', values);
    },
    async issueKey(key) {
        pushMeta('qa-issue-key', key);
    },
    async issueKeys(keys) {
        pushMeta('qa-issue-keys', keys);
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
        const outcome = await (0, forge_commons_1.uploadAttachmentForQa)({
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
