/**
 * FR41 wire shape for `assertionResults[].meta.qa`
 * (architecture ingest contract — simplified TestResultType serialization).
 */
export type QaMetaStepWire = {
    id: string;
    stepType: 'text' | 'gherkin' | 'request';
    name: string;
    status: 'passed' | 'failed' | 'skipped' | 'blocked';
};
export type QaMetaAttachmentWire = {
    file_name?: string;
    mime_type?: string;
    size?: number;
    /** Jira attachment id after Phase 3 Forge→Jira upload. */
    content_ref?: string;
};
export type QaMetaFramework = 'vitest' | 'jest' | 'mocha' | 'cucumberjs' | 'cypress' | 'playwright' | 'wdio';
export type QaMetaWire = {
    framework?: QaMetaFramework;
    title?: string;
    comment?: string;
    fields?: Record<string, string>;
    parameters?: Record<string, string>;
    suite?: Array<{
        title: string;
    }>;
    /**
     * Explicit Jira issue keys for FR43 (preferred over embedding keys in titles).
     * Roles (test_case / requirement / …) are classified server-side via TMS type map.
     */
    issueKeys?: string[];
    steps?: QaMetaStepWire[];
    attachments?: QaMetaAttachmentWire[];
    ignore?: boolean;
    host?: {
        framework?: string;
        reporter?: string;
    };
};
export type QaAnnotationLike = {
    message?: string;
    type?: string;
    body?: unknown;
};
export type QaMetaAccumulator = {
    title?: string;
    comment?: string;
    suite?: string;
    fields?: Record<string, string>;
    parameters?: Record<string, string>;
    issueKeys: string[];
    steps: Array<{
        name: string;
        status: QaMetaStepWire['status'];
    }>;
    attachments: QaMetaAttachmentWire[];
    ignore?: boolean;
};
export declare function createQaMetaAccumulator(): QaMetaAccumulator;
/**
 * Apply a Vitest/Jest QA annotation (or typed helper entry) onto an accumulator.
 * Non-QA annotations are ignored.
 */
export declare function applyQaAnnotation(acc: QaMetaAccumulator, ann: QaAnnotationLike): void;
export declare function applyQaAnnotations(acc: QaMetaAccumulator, annotations: readonly QaAnnotationLike[]): void;
export type ToQaMetaWireOptions = {
    framework: QaMetaFramework;
    reporter?: string;
};
/** Returns undefined when accumulator has no QA data (omit empty meta.qa). */
export declare function toQaMetaWire(acc: QaMetaAccumulator, options: ToQaMetaWireOptions): QaMetaWire | undefined;
/** Build meta.qa from typed helper buffer entries (`{ type, body }`). */
export declare function qaMetaFromEntries(entries: ReadonlyArray<{
    type: string;
    body: unknown;
}>, options: ToQaMetaWireOptions): QaMetaWire | undefined;
