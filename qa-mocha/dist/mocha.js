"use strict";
/**
 * Programmatic helpers for Mocha tests (FR86 / NFR26 + Phase 3 FR94 attach upload).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.qa = void 0;
exports.drainQaMeta = drainQaMeta;
const forge_commons_1 = require("@ai-testing-tool/forge-commons");
const localBuffer = [];
function pushMeta(type, body) {
    const entry = { type, body };
    if (globalThis.__QA_MOCHA_BRIDGE__) {
        globalThis.__QA_MOCHA_BRIDGE__.push(entry);
        return;
    }
    localBuffer.push(entry);
}
function drainQaMeta() {
    if (globalThis.__QA_MOCHA_BRIDGE__) {
        return globalThis.__QA_MOCHA_BRIDGE__.drain();
    }
    const copy = [...localBuffer];
    localBuffer.length = 0;
    return copy;
}
function isThenable(value) {
    return (typeof value === 'object' &&
        value !== null &&
        typeof value.then === 'function');
}
function currentTestTitle() {
    return globalThis.__QA_MOCHA_BRIDGE__?.currentTitle;
}
exports.qa = {
    title(value) {
        pushMeta('qa-title', value);
    },
    comment(value) {
        pushMeta('qa-comment', value);
    },
    suite(value) {
        pushMeta('qa-suite', value);
    },
    fields(values) {
        pushMeta('qa-fields', values);
    },
    parameters(values) {
        pushMeta('qa-parameters', values);
    },
    issueKey(key) {
        pushMeta('qa-issue-key', key);
    },
    issueKeys(keys) {
        pushMeta('qa-issue-keys', keys);
    },
    ignore() {
        pushMeta('qa-ignore', true);
    },
    step(name, body) {
        pushMeta('qa-step', name);
        try {
            const result = body();
            if (isThenable(result)) {
                return result.then(() => {
                    pushMeta('qa-step-end', { name, status: 'passed' });
                }, (error) => {
                    pushMeta('qa-step-failed', { name, status: 'failed' });
                    throw error;
                });
            }
            pushMeta('qa-step-end', { name, status: 'passed' });
        }
        catch (error) {
            pushMeta('qa-step-failed', { name, status: 'failed' });
            throw error;
        }
    },
    attach(attach) {
        const mime = attach.contentType ?? attach.type;
        const hasBinary = attach.content !== undefined || Boolean(attach.path);
        if (!hasBinary) {
            pushMeta('qa-attach', {
                name: attach.name,
                contentType: mime,
            });
            return;
        }
        return (0, forge_commons_1.uploadAttachmentForQa)({
            fileName: attach.name,
            mimeType: mime,
            content: attach.content,
            path: attach.path,
            issueKey: attach.issueKey,
            issueKeySources: [attach.issueKey, currentTestTitle()],
        }).then((outcome) => {
            pushMeta('qa-attach', {
                name: outcome.attachment.file_name ?? attach.name,
                contentType: outcome.attachment.mime_type ?? mime,
                size: outcome.attachment.size,
                content_ref: outcome.attachment.content_ref,
            });
        });
    },
};
