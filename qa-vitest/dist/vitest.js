"use strict";
/**
 * Programmatic helpers for Vitest tests (FR98 + Phase 3 FR107 attach upload).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.qa = void 0;
exports.withQa = withQa;
const forge_commons_1 = require("@ai-testing-tool/forge-commons");
function vitestCurrentTitle(ctx) {
    const task = ctx?.task;
    if (task?.fullName)
        return task.fullName;
    if (task?.name)
        return task.name;
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { expect } = require('vitest');
        return expect?.getState?.()?.currentTestName;
    }
    catch {
        return undefined;
    }
}
function createQaHelpers(annotate, titleSources) {
    return {
        async title(value) {
            await annotate(`QA Title: ${value}`, { type: 'qa-title', body: value });
        },
        async comment(value) {
            await annotate(`QA Comment: ${value}`, { type: 'qa-comment', body: value });
        },
        async suite(value) {
            await annotate(`QA Suite: ${value}`, { type: 'qa-suite', body: value });
        },
        async fields(values) {
            await annotate(`QA Fields: ${JSON.stringify(values)}`, {
                type: 'qa-fields',
                body: values,
            });
        },
        async parameters(values) {
            await annotate(`QA Parameters: ${JSON.stringify(values)}`, {
                type: 'qa-parameters',
                body: values,
            });
        },
        async issueKey(key) {
            await annotate(`QA IssueKey: ${key}`, { type: 'qa-issue-key', body: key });
        },
        async issueKeys(keys) {
            await annotate(`QA IssueKeys: ${keys.join(',')}`, {
                type: 'qa-issue-keys',
                body: keys,
            });
        },
        ignore() {
            // Sync only
        },
        async step(name, body) {
            await annotate(`QA Step: ${name}`, { type: 'qa-step', body: name });
            try {
                await body();
                await annotate(`QA Step End: ${name}`, {
                    type: 'qa-step-end',
                    body: { name, status: 'passed' },
                });
            }
            catch (error) {
                await annotate(`QA Step Failed: ${name}`, {
                    type: 'qa-step-failed',
                    body: { name, status: 'failed' },
                });
                throw error;
            }
        },
        async attach(attach) {
            const mime = attach.type ?? attach.contentType;
            const outcome = await (0, forge_commons_1.uploadAttachmentForQa)({
                fileName: attach.name,
                mimeType: mime,
                content: attach.content,
                path: attach.path,
                issueKey: attach.issueKey,
                issueKeySources: [attach.issueKey, ...titleSources()],
            });
            await annotate(`QA Attach: ${outcome.attachment.file_name ?? attach.name ?? 'file'}`, {
                type: 'qa-attach',
                body: {
                    name: outcome.attachment.file_name ?? attach.name,
                    type: outcome.attachment.mime_type ?? mime,
                    size: outcome.attachment.size,
                    content_ref: outcome.attachment.content_ref,
                },
            });
        },
    };
}
/**
 * Wrap a Vitest test body to inject `qa` helpers (uses Vitest `annotate` when present).
 */
function withQa(fn) {
    return async (ctx) => {
        const annotate = typeof ctx.annotate === 'function'
            ? ctx.annotate
            : async () => undefined;
        const qa = createQaHelpers(annotate, () => [vitestCurrentTitle(ctx)]);
        await fn({ ...ctx, qa, annotate });
    };
}
/** Standalone helpers when not using withQa (no-op annotate). */
exports.qa = createQaHelpers(async () => undefined, () => [
    vitestCurrentTitle(),
]);
