import { IngestClient } from '../client';
import type { ConfigType } from '../config';
import { EnvIngestEnum } from '../env';
import { ModeEnum, type OptionsType } from '../options';
import {
  FileReporter,
  IngestReporter,
  type InternalReporterInterface,
} from '../reporters';
import { DisabledException, type LoggerInterface } from '../utils';
import { FsWriter } from '../writer';

export class ReporterFactory {
  constructor(private readonly logger: LoggerInterface) {}

  create(mode: ModeEnum, options: ConfigType & OptionsType): InternalReporterInterface {
    switch (mode) {
      case ModeEnum.ingest:
        return this.createIngest(options);
      case ModeEnum.file:
        return this.createFile(options);
      case ModeEnum.off:
        throw new DisabledException('AiTestingTool reporter is disabled (mode=off)');
      default:
        throw new Error(`Unknown mode: ${String(mode)}`);
    }
  }

  private createIngest(options: ConfigType & OptionsType): IngestReporter {
    if (!options.ingest?.token) {
      throw new Error(
        `Either "ingest.token" or "${EnvIngestEnum.token}" is required in ingest mode`,
      );
    }
    if (!options.ingest?.url) {
      throw new Error(
        `Either "ingest.url" or "${EnvIngestEnum.url}" is required in ingest mode`,
      );
    }
    if (!options.projectKey) {
      throw new Error('projectKey is required in ingest mode');
    }

    const client = new IngestClient({
      ...options.ingest,
      logger: this.logger,
    });
    return new IngestReporter(this.logger, client);
  }

  private createFile(options: ConfigType & OptionsType): FileReporter {
    if (!options.projectKey) {
      throw new Error('projectKey is required in file mode');
    }
    const writer = new FsWriter(options.file);
    return new FileReporter(this.logger, writer);
  }
}
