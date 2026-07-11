import type { IngestPayload } from '../models';
import { FsWriter } from '../writer';
import type { LoggerInterface } from '../utils';
import type { InternalReporterInterface } from './reporter-interface';

export class FileReporter implements InternalReporterInterface {
  private readonly writer: FsWriter;
  private readonly logger: LoggerInterface;

  constructor(logger: LoggerInterface, writer: FsWriter) {
    this.logger = logger;
    this.writer = writer;
  }

  async publishPayload(payload: IngestPayload): Promise<void> {
    const path = this.writer.writePayload(payload);
    this.logger.log(`Wrote ingest payload to ${path}`);
  }
}
