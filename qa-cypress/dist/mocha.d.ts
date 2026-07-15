/**
 * Programmatic helpers for Cypress Mocha specs (FR63–FR64).
 * Prefer Jira issue keys in `it('AUTH-101 ...')` titles (FR43).
 *
 * `qa.step()` accepts **synchronous** callbacks only (no async/await) —
 * Cypress command-queue safe.
 *
 * In the browser, helpers forward via `cy.task` (requires `qa-forge-cypress/metadata`).
 * Outside Cypress (unit tests), they use an in-process buffer.
 */
import { MetadataManager } from './metadata-manager';
type SyncStepFn = () => void;
export type QaHelpers = {
    title(value: string): void;
    comment(value: string): void;
    suite(value: string): void;
    parameters(values: Record<string, string>): void;
    ignore(): void;
    /** Sync callback only (FR64). */
    step(name: string, body: SyncStepFn): void;
};
export declare const qa: QaHelpers;
export { MetadataManager };
export type { QaMetaEntry } from './metadata-manager';
