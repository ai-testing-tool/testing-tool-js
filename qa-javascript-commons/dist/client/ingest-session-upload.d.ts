import type { LoggerInterface } from '../utils';
import type { ChunkPlan } from './ingest-chunk-plan';
import { type IngestResponse } from './ingest-http';
import { type IngestUploadProgressHandler } from './ingest-progress';
import { type RetryPolicy } from './ingest-retry';
export type UploadChunkedIngestInput = {
    url: string;
    token: string;
    plan: ChunkPlan;
    timeoutMs: number;
    completeTimeoutMs: number;
    retryPolicy: RetryPolicy;
    logger?: LoggerInterface;
    onProgress?: IngestUploadProgressHandler;
};
export declare function uploadChunkedIngest(input: UploadChunkedIngestInput): Promise<IngestResponse>;
