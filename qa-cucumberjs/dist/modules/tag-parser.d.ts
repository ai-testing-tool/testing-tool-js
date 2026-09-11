import type { PickleTag } from '@cucumber/messages';
/** Parsed Gherkin tags → AiTestingTool meta (FR52). */
export type CucumberQaTagMeta = {
    title: string | null;
    ignore: boolean;
    suite: string | null;
    suiteId: string | null;
    planId: string | null;
    planName: string | null;
    fixVersion: string | null;
    sprintName: string | null;
    labels: string[];
    fields: Record<string, string>;
    parameters: Record<string, string>;
    /** Issue keys from tags like @AUTH-101 (FR51). */
    issueKeys: string[];
};
type TagLike = Pick<PickleTag, 'name'> | {
    name: string;
};
/**
 * Parse `@Qa*` and issue-key tags from a pickle.
 * No competitor tag names — destination is Jira.
 */
export declare function parseQaTags(tags: readonly TagLike[]): CucumberQaTagMeta;
/** Prefer `@title:` tag value; otherwise keep the pickle name as-is (no issue-key prefix). */
export declare function resolveScenarioTitle(pickleName: string, meta: CucumberQaTagMeta): string;
export {};
