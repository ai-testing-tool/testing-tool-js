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
export type QaMetaCi = {
    platform?: string;
    buildUrl?: string;
};
export type QaMetaGit = {
    commitSha?: string;
    branch?: string;
    authorName?: string;
    authorEmail?: string;
};
export type QaMetaHost = {
    framework?: string;
    reporter?: string;
    ci?: QaMetaCi;
    git?: QaMetaGit;
};
export type QaMetaWire = {
    framework?: QaMetaFramework;
    title?: string;
    comment?: string;
    fields?: Record<string, string>;
    parameters?: Record<string, string>;
    suite?: Array<{
        title: string;
    }>;
    /** Optional client-supplied suite identity (title path still via `suite`). */
    suiteId?: string;
    /** Plan id from `qa.planId`. */
    planId?: string;
    /** Plan display name from `qa.plan`. */
    planName?: string;
    /** Fix version from `qa.fixVersion`. */
    fixVersion?: string;
    /** Sprint name from `qa.sprintName`. */
    sprintName?: string;
    /** Free-form labels (comma-separated input normalized to unique strings). */
    labels?: string[];
    /**
     * Explicit Jira issue keys for FR43 (required for linking — titles are not scraped).
     * Roles (test_case / requirement / …) are classified server-side via TMS type map.
     */
    issueKeys?: string[];
    steps?: QaMetaStepWire[];
    attachments?: QaMetaAttachmentWire[];
    ignore?: boolean;
    host?: QaMetaHost;
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
    suiteId?: string;
    planId?: string;
    planName?: string;
    fixVersion?: string;
    sprintName?: string;
    fields?: Record<string, string>;
    parameters?: Record<string, string>;
    labels: string[];
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
    ci?: {
        platform?: string;
        buildUrl?: string;
    };
    git?: {
        commitSha?: string;
        branch?: string;
        authorName?: string;
        authorEmail?: string;
    };
};
/** Resolve CI/git once per process for meta.qa.host (overridable via options). */
export declare function resolveHostEnvironment(options?: {
    ci?: ToQaMetaWireOptions['ci'];
    git?: ToQaMetaWireOptions['git'];
}): {
    ci?: QaMetaCi;
    git?: QaMetaGit;
};
/** Test helper — clear memoized CI/git host environment. */
export declare function resetHostEnvironmentCache(): void;
/** Returns undefined when accumulator has no QA data (omit empty meta.qa). */
export declare function toQaMetaWire(acc: QaMetaAccumulator, options: ToQaMetaWireOptions): QaMetaWire | undefined;
/** Build meta.qa from typed helper buffer entries (`{ type, body }`). */
export declare function qaMetaFromEntries(entries: ReadonlyArray<{
    type: string;
    body: unknown;
}>, options: ToQaMetaWireOptions): QaMetaWire | undefined;
