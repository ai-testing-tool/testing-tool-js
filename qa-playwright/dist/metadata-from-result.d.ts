import { type QaMetaWire } from '@qanalyzer/forge-commons';
import type { PlaywrightStepLike } from './step-extractor';
export type PlaywrightAttachmentLike = {
    name: string;
    contentType: string;
    body?: Buffer | string;
    /** Disk path when Playwright wrote the attachment to a file. */
    path?: string;
};
/**
 * Merge `qa.*` helper attachments + native `test.step` into `meta.qa`.
 */
export declare function buildQaMetaFromResult(input: {
    attachments?: readonly PlaywrightAttachmentLike[];
    steps?: readonly PlaywrightStepLike[];
}): QaMetaWire | undefined;
