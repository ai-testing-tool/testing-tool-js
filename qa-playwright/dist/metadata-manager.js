"use strict";
/**
 * In-process metadata buffer for unit tests and when Playwright test.info()
 * is unavailable. Live runs prefer test.info().attach (see helpers.ts).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.QA_METADATA_CONTENT_TYPE = exports.MetadataManager = void 0;
const entries = [];
exports.MetadataManager = {
    clear() {
        entries.length = 0;
    },
    push(type, body) {
        entries.push({ type, body });
    },
    getEntries() {
        return [...entries];
    },
};
/** Content type for metadata attachments read by the reporter (Story 2.7.2). */
exports.QA_METADATA_CONTENT_TYPE = 'application/ai-testing-tool.metadata+json';
