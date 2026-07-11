"use strict";
/**
 * Programmatic helpers for Vitest tests (FR98).
 * Prefer Jira issue keys in test titles; use these for suite/fields/steps metadata.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.qa = void 0;
exports.withQa = withQa;
function createQaHelpers(annotate) {
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
        ignore() {
            // Sync only — marks intent; runner skip is still the caller's responsibility
        },
        async step(name, body) {
            await annotate(`QA Step: ${name}`, { type: 'qa-step', body: name });
            await body();
        },
        async attach(attach) {
            await annotate(`QA Attach: ${attach.name ?? 'file'}`, {
                type: 'qa-attach',
                body: { name: attach.name, type: attach.type },
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
        const qa = createQaHelpers(annotate);
        await fn({ ...ctx, qa, annotate });
    };
}
/** Standalone helpers when not using withQa (no-op annotate). */
exports.qa = createQaHelpers(async () => undefined);
