/**
 * In-process metadata buffer for unit tests and when WDIO IPC is unavailable.
 * Live runs may also emit process events (see helpers) for the reporter (2.8.2).
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
