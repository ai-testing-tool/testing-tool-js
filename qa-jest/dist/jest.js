"use strict";
/**
 * Programmatic helpers for Jest tests (FR75).
 * Prefer Jira issue keys in test titles; use these for suite/fields/steps metadata.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.qa = void 0;
exports.drainQaMeta = drainQaMeta;
/** In-memory buffer for future meta.qa enrichment (scaffold: collect only). */
const metaBuffer = [];
function drainQaMeta() {
    const copy = [...metaBuffer];
    metaBuffer.length = 0;
    return copy;
}
function pushMeta(type, body) {
    metaBuffer.push({ type, body });
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
        await body();
    },
    async attach(attach) {
        pushMeta('qa-attach', {
            name: attach.name,
            contentType: attach.contentType ?? attach.type,
        });
    },
};
