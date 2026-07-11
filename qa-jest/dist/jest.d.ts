/**
 * Programmatic helpers for Jest tests (FR75).
 * Prefer Jira issue keys in test titles; use these for suite/fields/steps metadata.
 */
type StepFn = () => Promise<void> | void;
export type QaHelpers = {
    title(value: string): Promise<void>;
    comment(value: string): Promise<void>;
    suite(value: string): Promise<void>;
    fields(values: Record<string, string>): Promise<void>;
    parameters(values: Record<string, string>): Promise<void>;
    ignore(): void;
    step(name: string, body: StepFn): Promise<void>;
    attach(attach: {
        name?: string;
        contentType?: string;
        type?: string;
        content?: string;
    }): Promise<void>;
};
type QaMetaEntry = {
    type: string;
    body: unknown;
};
export declare function drainQaMeta(): QaMetaEntry[];
export declare const qa: QaHelpers;
export {};
