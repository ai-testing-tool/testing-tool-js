/**
 * Programmatic helpers for Mocha tests (FR86 / NFR26 + Phase 3 FR94 attach upload).
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
    title(value: string): void;
    comment(value: string): void;
    suite(value: string): void;
    fields(values: Record<string, string>): void;
    parameters(values: Record<string, string>): void;
    ignore(): void;
    step(name: string, body: StepFn): void | Promise<void>;
    /** Sync metadata-only when no content; returns Promise when uploading. */
    attach(attach: QaAttachInput): void | Promise<void>;
};
export type QaMetaEntry = {
    type: string;
    body: unknown;
};
export type QaMochaBridge = {
    push(entry: QaMetaEntry): void;
    drain(): QaMetaEntry[];
    currentTitle?: string;
};
declare global {
    var __QA_MOCHA_BRIDGE__: QaMochaBridge | undefined;
}
export declare function drainQaMeta(): QaMetaEntry[];
export declare const qa: QaHelpers;
export {};
