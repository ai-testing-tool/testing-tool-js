import { IngestClient } from '../client';
import type { IngestPayload } from '../models';
import type { LoggerInterface } from '../utils';
import type { InternalReporterInterface } from './reporter-interface';
export declare class IngestReporter implements InternalReporterInterface {
    private readonly client;
    constructor(logger: LoggerInterface, client: IngestClient);
    publishPayload(payload: IngestPayload): Promise<void>;
}
