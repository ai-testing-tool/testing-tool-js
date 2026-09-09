export type IngestAction = 'session' | 'chunk' | 'complete';
export type PostIngestJsonInput = {
    url: string;
    token: string;
    body: unknown;
    timeoutMs: number;
    action?: IngestAction;
};
export type PostIngestJsonResult = {
    status: number;
    body: unknown;
};
export type IngestResponse = PostIngestJsonResult;
export declare class IngestHttpError extends Error {
    readonly status?: number;
    readonly body: unknown;
    readonly retryable: boolean;
    constructor(message: string, options: {
        status?: number;
        body?: unknown;
        retryable: boolean;
    });
}
/** Append `action=` query param for session/chunk/complete web-trigger routes. */
export declare function withIngestAction(url: string, action?: IngestAction): string;
export declare function isRetryableHttpStatus(status: number): boolean;
export declare function isRetryableError(error: unknown): boolean;
export declare function postIngestJson(input: PostIngestJsonInput): Promise<PostIngestJsonResult>;
