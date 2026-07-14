import type { LoggerInterface } from '../utils';
export type AttachClientOptions = {
    /**
     * Shared Forge CI webtrigger URL (`QANALYZER_INGEST_URL`).
     * Legacy `QANALYZER_ATTACH_URL` is accepted as a fallback alias.
     */
    url?: string;
    /** Same Bearer token as ingest (`QANALYZER_INGEST_TOKEN`). */
    token?: string;
    timeoutMs?: number;
    /** Max decoded file bytes (default 3_000_000). */
    maxBytes?: number;
    logger?: LoggerInterface;
};
export type AttachUploadInput = {
    projectKey: string;
    issueKey: string;
    fileName: string;
    mimeType: string;
    content: Buffer | Uint8Array | string;
};
export type AttachUploadResult = {
    issueKey: string;
    /**
     * Jira attachment id when the proxy returns it. Static Forge webtriggers only echo
     * `{"ok":true}`, so callers should treat this as optional and fall back to issue+filename.
     */
    id?: string;
    filename: string;
    mimeType: string;
    size: number;
};
export declare const DEFAULT_MAX_ATTACH_BYTES = 3000000;
/** Append `action=attach` so the shared ingest webtrigger dispatches correctly. */
export declare function withAttachAction(url: string): string;
/**
 * Client for Phase 3 Forge attach proxy → Jira Attachment API.
 * Uses the shared ingest webtrigger URL; sends JSON + base64 (not FR41).
 */
export declare class AttachClient {
    private readonly url?;
    private readonly token?;
    private readonly timeoutMs;
    private readonly maxBytes;
    private readonly logger?;
    constructor(options?: AttachClientOptions);
    upload(input: AttachUploadInput): Promise<AttachUploadResult>;
}
