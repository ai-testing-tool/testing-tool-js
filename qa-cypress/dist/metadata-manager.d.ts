/**
 * In-memory metadata for the current Cypress/Mocha test.
 * Full result wiring lands in Story 2.6.2; scaffold keeps registration safe.
 */
export type QaMetaEntry = {
    type: string;
    body: unknown;
};
export declare const MetadataManager: {
    clear(): void;
    push(type: string, body: unknown): void;
    getEntries(): QaMetaEntry[];
};
