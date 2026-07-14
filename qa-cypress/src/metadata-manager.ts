/**
 * In-memory metadata for the current Cypress/Mocha test.
 * Full result wiring lands in Story 2.6.2; scaffold keeps registration safe.
 */

export type QaMetaEntry = {
  type: string;
  body: unknown;
};

const entries: QaMetaEntry[] = [];

export const MetadataManager = {
  clear(): void {
    entries.length = 0;
  },

  push(type: string, body: unknown): void {
    entries.push({ type, body });
  },

  getEntries(): QaMetaEntry[] {
    return [...entries];
  },
};
