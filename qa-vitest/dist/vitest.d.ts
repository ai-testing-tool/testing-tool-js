/**
 * Programmatic helpers for Vitest tests (FR98).
 * Prefer Jira issue keys in test titles; use these for suite/fields/steps metadata.
 */
type StepFn = () => Promise<void> | void;
type AnnotateFn = (message: string, options?: {
    type?: string;
    body?: unknown;
}) => Promise<void>;
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
        type?: string;
        content?: string;
    }): Promise<void>;
};
export type QaTestContext = {
    qa: QaHelpers;
    annotate: AnnotateFn;
};
type VitestTestFn = (ctx: QaTestContext & Record<string, unknown>) => Promise<void> | void;
/**
 * Wrap a Vitest test body to inject `qa` helpers (uses Vitest `annotate` when present).
 */
export declare function withQa(fn: VitestTestFn): VitestTestFn;
/** Standalone helpers when not using withQa (no-op annotate). */
export declare const qa: QaHelpers;
export {};
