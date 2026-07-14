"use strict";
/**
 * In-process metadata buffer for unit tests and when WDIO IPC is unavailable.
 * Live runs may also emit process events (see helpers) for the reporter (2.8.2).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetadataManager = void 0;
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
