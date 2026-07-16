/**
 * Programmatic helpers for Playwright tests (FR111).
 * Prefer `qa.issueKey()` / `qa.issueKeys()` for FR43 (do not embed keys in titles).
 *
 * Steps: use Playwright native `test.step()` — do **not** use `qa.step` (FR112).
 *
 * In a live Playwright run, metadata is attached via `test.info().attach`.
 * Outside Playwright (unit tests), helpers use an in-process buffer.
 *
 * `qa.attach` with binary content/path uploads via Forge when configured (FR119).
 */
import { MetadataManager, QA_METADATA_CONTENT_TYPE } from './metadata-manager';
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
    /** Attach metadata; with content/path, attempts Forge upload (FR119). */
    attach(attach: {
        name?: string;
        contentType?: string;
        content?: string | Buffer;
        path?: string;
        issueKey?: string;
    }): void | Promise<void>;
};
export declare const qa: QaHelpers;
export { MetadataManager, QA_METADATA_CONTENT_TYPE };
export type { QaMetaEntry } from './metadata-manager';
