import type { ConfigType } from '../config';
import { ModeEnum, type OptionsType } from '../options';
export type ResolvedOptions = {
    effectiveMode: ModeEnum;
    effectiveFallback: ModeEnum;
    composed: ConfigType & OptionsType;
};
export declare class OptionsResolver {
    resolve(options?: OptionsType): ResolvedOptions;
}
export declare function createDefaultConfig(): ConfigType;
