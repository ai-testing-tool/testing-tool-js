import type { PlaywrightAssertionInput } from './report-builder';
export type PlaywrightMediaAttachment = {
    name: string;
    contentType: string;
    body?: Buffer | string;
    path?: string;
};
/** Prefer PNG / still images; skip video, trace, and AiTestingTool metadata JSON. */
export declare function isStillImageAttachment(att: PlaywrightMediaAttachment): boolean;
/**
 * Upload still-image attachments for a failed test onto assertion meta.qa.
 */
export declare function enrichAssertionWithFailureScreenshots(assertion: PlaywrightAssertionInput, attachments: readonly PlaywrightMediaAttachment[] | undefined): Promise<void>;
