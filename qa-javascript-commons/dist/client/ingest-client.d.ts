import type { IngestOptionsType } from '../config';
import type { IngestPayload } from '../models';
import type { LoggerInterface } from '../utils';
import { type IngestResponse } from './ingest-http';
export type { IngestResponse } from './ingest-http';
export type IngestClientOptions = IngestOptionsType & {
    logger?: LoggerInterface;
};
export declare class IngestClient {
    private readonly url?;
    private readonly token?;
    private readonly timeoutMs;
    private readonly completeTimeoutMs;
    private readonly maxPayloadBytes;
    private readonly chunkThresholdBytes;
    private readonly chunkMaxBytes;
    private readonly retryPolicy;
    private readonly logger?;
    constructor(options?: IngestClientOptions);
    send(payload: IngestPayload): Promise<IngestResponse>;
    private sendDirect;
}
