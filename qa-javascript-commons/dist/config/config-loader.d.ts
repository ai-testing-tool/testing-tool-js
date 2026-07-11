import type { ConfigType } from './config-type';
export declare class ConfigLoader {
    private readonly paths;
    constructor(paths?: string[]);
    private read;
    load(): ConfigType | null;
}
export declare function loadConfig(paths?: string[]): ConfigType | null;
