/**
 * Programmatic helpers for Cypress Mocha specs (FR63–FR64).
 * Prefer `qa.issueKey()` / `qa.issueKeys()` for FR43 (do not embed keys in titles).
 *
 * `qa.step()` accepts **synchronous** callbacks only (no async/await) —
 * Cypress command-queue safe.
 *
 * In the browser, helpers forward via `cy.task` (requires `@ai-testing-tool/forge-cypress/metadata`).
 * Outside Cypress (unit tests), they use an in-process buffer.
 */
import { MetadataManager } from './metadata-manager';
type SyncStepFn = () => void;
export type QaHelpers = {
    title(value: string): void;
    comment(value: string): void;
    suite(value: string): void;
    suiteId(value: string): void;
    planId(value: string): void;
    /** Plan display name → `meta.qa.planName`. */
    plan(value: string): void;
    fixVersion(value: string): void;
    sprintName(value: string): void;
    /** Comma-separated string or array → `meta.qa.labels`. */
    labels(value: string | string[]): void;
    parameters(values: Record<string, string>): void;
    /** Explicit FR43 issue key (preferred over embedding in titles). */
    issueKey(key: string): void;
    /** Explicit FR43 issue keys (preferred over embedding in titles). */
    issueKeys(keys: string[]): void;
    ignore(): void;
    /** Sync callback only (FR64). */
    step(name: string, body: SyncStepFn): void;
};
export declare const qa: QaHelpers;
export { MetadataManager };
export type { QaMetaEntry } from './metadata-manager';
