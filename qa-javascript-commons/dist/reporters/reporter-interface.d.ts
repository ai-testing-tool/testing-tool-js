import type { IngestPayload } from '../models';
export interface InternalReporterInterface {
    publishPayload(payload: IngestPayload): Promise<void>;
}
