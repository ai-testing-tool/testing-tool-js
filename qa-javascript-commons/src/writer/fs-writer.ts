import { writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { mkdirSync } from 'fs';

import type { IngestPayload } from '../models';

export type FsWriterOptions = {
  path?: string;
};

export class FsWriter {
  private readonly path: string;

  constructor(options?: FsWriterOptions) {
    this.path = options?.path ?? './ai-testing-tool-results.json';
  }

  writePayload(payload: IngestPayload): string {
    const target = resolve(process.cwd(), this.path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
    return target;
  }
}
