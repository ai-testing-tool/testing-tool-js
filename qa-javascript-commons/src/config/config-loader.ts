import { readFileSync } from 'fs';
import { join } from 'path';

import type { ConfigType } from './config-type';

const DEFAULT_PATHS = ['qanalyzer.config.json', '.qanalyzerc'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertConfigShape(json: unknown, fileLabel: string): asserts json is ConfigType {
  if (!isRecord(json)) {
    throw new Error(`Invalid config: "${fileLabel}" must be a JSON object`);
  }
  if (json.mode !== undefined && typeof json.mode !== 'string') {
    throw new Error(`Invalid config: "mode" must be a string`);
  }
  if (json.projectKey !== undefined && typeof json.projectKey !== 'string') {
    throw new Error(`Invalid config: "projectKey" must be a string`);
  }
}

export class ConfigLoader {
  constructor(private readonly paths: string[] = DEFAULT_PATHS) {}

  private read(): string | null {
    for (const configPath of this.paths) {
      const filePath = join(process.cwd(), configPath);
      try {
        return readFileSync(filePath, 'utf8');
      } catch (error) {
        const code =
          error instanceof Error && 'code' in error
            ? String((error as NodeJS.ErrnoException).code)
            : '';
        if (code !== 'ENOENT' && code !== 'EISDIR') {
          throw new Error(`Cannot read config file "${configPath}"`, { cause: error });
        }
      }
    }
    return null;
  }

  load(): ConfigType | null {
    const data = this.read();
    if (!data) return null;

    let json: unknown;
    try {
      json = JSON.parse(data) as unknown;
    } catch (error) {
      throw new Error('Invalid config: file is not valid JSON', { cause: error });
    }

    assertConfigShape(json, 'root');
    return json;
  }
}

export function loadConfig(paths?: string[]): ConfigType | null {
  return new ConfigLoader(paths).load();
}
