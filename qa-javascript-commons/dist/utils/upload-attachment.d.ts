import type { QaMetaAttachmentWire } from '../models/meta-qa';
export declare const EnvAttachEnum: {
    /** @deprecated Prefer AI_TESTING_TOOL_INGEST_URL — attach uses the shared ingest webtrigger. */
    readonly url: "AI_TESTING_TOOL_ATTACH_URL";
    readonly maxBytes: "AI_TESTING_TOOL_ATTACH_MAX_BYTES";
};
export type UploadAttachParams = {
    /** Explicit issue key override. */
    issueKey?: string;
    /** Sources used to discover issue key (test title, tags, …). */
    issueKeySources?: Array<string | null | undefined>;
    projectKey?: string;
    fileName?: string;
    mimeType?: string;
    content?: Buffer | Uint8Array | string;
    /** Read file from disk when content omitted. */
    path?: string;
    attachUrl?: string;
    token?: string;
    maxBytes?: number;
};
export type UploadAttachOutcome = {
    uploaded: true;
    attachment: QaMetaAttachmentWire;
    issueKey: string;
} | {
    uploaded: false;
    attachment: QaMetaAttachmentWire;
    reason: string;
};
/**
 * Attempt Forge→Jira upload. On missing config/key/content, returns metadata-only (never throws
 * unless you want callers to catch — this helper swallows upload errors into `uploaded: false`).
 */
export declare function uploadAttachmentForQa(params: UploadAttachParams): Promise<UploadAttachOutcome>;
