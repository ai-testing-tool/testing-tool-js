import type { IngestPayload } from '../models';
import { FsWriter } from '../writer';
import type { LoggerInterface } from '../utils';
import type { InternalReporterInterface } from './reporter-interface';
export declare class FileReporter implements InternalReporterInterface {
    private readonly writer;
    private readonly logger;
    constructor(logger: LoggerInterface, writer: FsWriter);
    publishPayload(payload: IngestPayload): Promise<void>;
}
