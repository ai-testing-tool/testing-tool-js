import type { ConfigType } from '../config';
import { EnvEnum, EnvFileEnum, EnvIngestEnum } from './env-enum';

function readEnv(name: string): string | undefined {
  const value = process.env[name];
  return value === '' ? undefined : value;
}

function readBoolean(name: string): boolean | undefined {
  const value = readEnv(name);
  if (value === undefined) return undefined;
  return value === '1' || value.toLowerCase() === 'true';
}

function readNumber(name: string): number | undefined {
  const value = readEnv(name);
  if (value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/** Map QANALYZER_* env vars to nested config (highest precedence in composeOptions). */
export function envToConfig(): ConfigType {
  const config: ConfigType = {
    mode: readEnv(EnvEnum.mode) as ConfigType['mode'],
    fallback: readEnv(EnvEnum.fallback) as ConfigType['fallback'],
    debug: readBoolean(EnvEnum.debug),
    projectKey: readEnv(EnvEnum.projectKey),
    launchName: readEnv(EnvEnum.launchName),
    ingest: {
      url: readEnv(EnvIngestEnum.url),
      token: readEnv(EnvIngestEnum.token),
      timeoutMs: readNumber(EnvIngestEnum.timeoutMs),
      maxPayloadBytes: readNumber(EnvIngestEnum.maxPayloadBytes),
    },
    file: {
      path: readEnv(EnvFileEnum.path),
    },
  };

  if (
    config.ingest &&
    Object.values(config.ingest).every((value) => value === undefined)
  ) {
    delete config.ingest;
  }
  if (config.file && Object.values(config.file).every((value) => value === undefined)) {
    delete config.file;
  }

  return config;
}
