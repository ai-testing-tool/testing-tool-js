import type { IngestOptionsType } from '../config';
import type { IngestPayload } from '../models';
import type { LoggerInterface } from '../utils';
export type IngestClientOptions = IngestOptionsType & {
    logger?: LoggerInterface;
};
export type IngestResponse = {
    status: number;
    body: unknown;
};
export declare class IngestClient {
    private readonly url?;
    private readonly token?;
    private readonly timeoutMs;
    private readonly maxPayloadBytes;
    private readonly logger?;
    constructor(options?: IngestClientOptions);
    send(payload: IngestPayload): Promise<IngestResponse>;
}
