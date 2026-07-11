import type { ConfigType } from '../config';
import { envToConfig } from '../env';
import { composeOptions, ModeEnum, type OptionsType } from '../options';

export type ResolvedOptions = {
  effectiveMode: ModeEnum;
  effectiveFallback: ModeEnum;
  composed: ConfigType & OptionsType;
};

export class OptionsResolver {
  resolve(options: OptionsType = {}): ResolvedOptions {
    const composed = composeOptions<ConfigType & OptionsType>(
      createDefaultConfig(),
      options,
      envToConfig(),
    );

    return {
      effectiveMode: (composed.mode as ModeEnum) ?? ModeEnum.off,
      effectiveFallback: (composed.fallback as ModeEnum) ?? ModeEnum.off,
      composed,
    };
  }
}

export function createDefaultConfig(): ConfigType {
  return {
    mode: ModeEnum.off,
    fallback: ModeEnum.off,
    debug: false,
    ingest: {
      timeoutMs: 30_000,
      maxPayloadBytes: 4_500_000,
    },
    file: {
      path: './qanalyzer-results.json',
    },
  };
}
