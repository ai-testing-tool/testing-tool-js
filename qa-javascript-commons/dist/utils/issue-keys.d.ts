/**
 * Extract Jira issue keys from titles / tags (FR43) — shared with reporters for attach target.
 */
export declare function extractIssueKeys(...sources: Array<string | null | undefined>): string[];
export declare function firstIssueKey(...sources: Array<string | null | undefined>): string | null;
/** Project key prefix from AUTH-101 → AUTH. */
export declare function projectKeyFromIssueKey(issueKey: string): string | null;
