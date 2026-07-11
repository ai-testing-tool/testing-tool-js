import type { IngestPayload } from '../models';
export type FsWriterOptions = {
    path?: string;
};
export declare class FsWriter {
    private readonly path;
    constructor(options?: FsWriterOptions);
    writePayload(payload: IngestPayload): string;
}
