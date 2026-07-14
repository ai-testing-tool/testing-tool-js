/**
 * Map WDIO Cucumber tags → MetadataManager / issue-key sources (FR135 / FR43).
 * Supports `@suite=…`, `@tags=…`, `@title=…` and bare `@PROJ-123` issue keys.
 * Does not handle Qase `@QaseId`.
 */
export type TagLike = {
    name: string;
};
export type CucumberTagApplyResult = {
    issueKeys: string[];
};
/**
 * Apply Cucumber scenario tags onto MetadataManager; return bare issue keys.
 */
export declare function applyCucumberTags(tags: readonly TagLike[]): CucumberTagApplyResult;
