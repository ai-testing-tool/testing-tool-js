/**
 * Programmatic helpers for WebdriverIO Mocha specs (FR125–FR126).
 * Prefer `qa.issueKey()` / `qa.issueKeys()` for FR43 (do not embed keys in titles).
 *
 * Steps: `await qa.step('name', async (step) => { await step.step('nested', ...) })`.
 *
 * `qa.attach({ type })` — use **type** (not contentType). With content/paths,
 * attempts Forge upload (FR133).
 */
import { MetadataManager } from './metadata-manager';
export type QaStepFn = (step: QaStepApi) => void | Promise<void>;
export type QaStepApi = {
    step(name: string, body: QaStepFn): Promise<void>;
};
export type QaHelpers = {
    title(value: string): void;
    comment(value: string): void;
    suite(value: string): void;
    fields(values: Record<string, string>): void;
    parameters(values: Record<string, string>): void;
    /** Explicit FR43 issue key (preferred over embedding in titles). */
    issueKey(key: string): void;
    /** Explicit FR43 issue keys (preferred over embedding in titles). */
    issueKeys(keys: string[]): void;
    ignore(): void;
    /** Async step with nested `step.step()` (FR125). */
    step(name: string, body: QaStepFn): Promise<void>;
    /** Use `type` (FR126); with content/paths uploads via Forge (FR133). */
    attach(attach: {
        name?: string;
        type?: string;
        content?: string | Buffer;
        paths?: string[];
        path?: string;
        issueKey?: string;
    }): void | Promise<void>;
};
export declare const qa: QaHelpers;
export { MetadataManager };
export type { QaMetaEntry } from './metadata-manager';
