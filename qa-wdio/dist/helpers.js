"use strict";
/**
 * Programmatic helpers for WebdriverIO Mocha specs (FR125–FR126).
 * Prefer Jira issue keys in `it('AUTH-101 ...')` titles (FR43).
 *
 * Steps: `await qa.step('name', async (step) => { await step.step('nested', ...) })`.
 *
 * `qa.attach({ type })` — use **type** (not contentType). With content/paths,
 * attempts Forge upload (FR133).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetadataManager = exports.qa = void 0;
const qa_javascript_commons_1 = require("qa-javascript-commons");
const metadata_manager_1 = require("./metadata-manager");
Object.defineProperty(exports, "MetadataManager", { enumerable: true, get: function () { return metadata_manager_1.MetadataManager; } });
function push(type, body) {
    metadata_manager_1.MetadataManager.push(type, body);
}
function currentTitle() {
    try {
        // Mocha context title when available
        const g = globalThis;
        return g.currentTest?.title;
    }
    catch {
        return undefined;
    }
}
async function runStep(name, body) {
    push('qa-step-start', name);
    const api = {
        step(nestedName, nestedBody) {
            return runStep(nestedName, nestedBody);
        },
    };
    try {
        await body(api);
        push('qa-step-end', { name, status: 'passed' });
    }
    catch (err) {
        push('qa-step-end', { name, status: 'failed' });
        throw err;
    }
}
exports.qa = {
    title(value) {
        push('qa-title', value);
    },
    comment(value) {
        push('qa-comment', value);
    },
    suite(value) {
        push('qa-suite', value);
    },
    fields(values) {
        push('qa-fields', values);
    },
    parameters(values) {
        push('qa-parameters', values);
    },
    ignore() {
        push('qa-ignore', true);
    },
    step(name, body) {
        return runStep(name, body);
    },
    attach(attach) {
        const mime = attach.type;
        const path = attach.path ?? attach.paths?.[0];
        const hasBinary = attach.content !== undefined || Boolean(path);
        if (!hasBinary) {
            push('qa-attach', {
                name: attach.name,
                type: mime,
            });
            return;
        }
        return (0, qa_javascript_commons_1.uploadAttachmentForQa)({
            fileName: attach.name,
            mimeType: mime,
            content: attach.content,
            path,
            issueKey: attach.issueKey,
            issueKeySources: [attach.issueKey, currentTitle()],
        })
            .then((outcome) => {
            push('qa-attach', {
                name: outcome.attachment.file_name ?? attach.name,
                type: outcome.attachment.mime_type ?? mime,
                size: outcome.attachment.size,
                content_ref: outcome.attachment.content_ref,
            });
        })
            .catch(() => {
            push('qa-attach', {
                name: attach.name,
                type: mime,
            });
        });
    },
};
