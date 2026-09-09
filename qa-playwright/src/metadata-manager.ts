/**
 * In-process metadata buffer for unit tests and when Playwright test.info()
 * is unavailable. Live runs prefer test.info().attach (see helpers.ts).
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

/** Content type for metadata attachments read by the reporter (Story 2.7.2). */
export const QA_METADATA_CONTENT_TYPE = 'application/ai-testing-tool.metadata+json';
