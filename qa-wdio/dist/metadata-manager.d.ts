/**
 * In-process metadata buffer for unit tests and when WDIO IPC is unavailable.
 * Live runs may also emit process events (see helpers) for the reporter (2.8.2).
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
