/**
 * In-process metadata buffer for unit tests and when Playwright test.info()
 * is unavailable. Live runs prefer test.info().attach (see helpers.ts).
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
/** Content type for metadata attachments read by the reporter (Story 2.7.2). */
export declare const QA_METADATA_CONTENT_TYPE = "application/qanalyzer.metadata+json";
