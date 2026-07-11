import { IngestClient } from '../client';
import type { IngestPayload } from '../models';
import type { LoggerInterface } from '../utils';
import type { InternalReporterInterface } from './reporter-interface';

export class IngestReporter implements InternalReporterInterface {
  private readonly client: IngestClient;

  constructor(logger: LoggerInterface, client: IngestClient) {
    this.client = client;
    void logger;
  }

  async publishPayload(payload: IngestPayload): Promise<void> {
    await this.client.send(payload);
  }
}
