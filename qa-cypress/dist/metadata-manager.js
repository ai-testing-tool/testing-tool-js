"use strict";
/**
 * In-memory metadata for the current Cypress/Mocha test.
 * Full result wiring lands in Story 2.6.2; scaffold keeps registration safe.
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
