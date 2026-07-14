/**
 * Programmatic helpers for Jest tests (FR75 + Phase 3 attach upload FR83).
 */
type StepFn = () => Promise<void> | void;
export type QaAttachInput = {
    name?: string;
    contentType?: string;
    type?: string;
    content?: string | Buffer | Uint8Array;
    path?: string;
    issueKey?: string;
};
export type QaHelpers = {
    title(value: string): Promise<void>;
    comment(value: string): Promise<void>;
    suite(value: string): Promise<void>;
    fields(values: Record<string, string>): Promise<void>;
    parameters(values: Record<string, string>): Promise<void>;
    ignore(): void;
    step(name: string, body: StepFn): Promise<void>;
    attach(attach: QaAttachInput): Promise<void>;
};
export type QaMetaEntry = {
    type: string;
    body: unknown;
};
export type QaJestBridge = {
    push(entry: QaMetaEntry): void;
    drain(): QaMetaEntry[];
    currentTitle?: string;
};
declare global {
    var __QA_JEST_BRIDGE__: QaJestBridge | undefined;
}
export declare function drainQaMeta(): QaMetaEntry[];
export declare const qa: QaHelpers;
export {};
