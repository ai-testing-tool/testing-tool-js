import type { ModeEnum } from './mode-enum';
import type { ConfigType } from '../config';
export type FrameworkOptionsType = {
    frameworkPackage?: string;
    frameworkName?: string;
    reporterName?: string;
};
export type OptionsType = FrameworkOptionsType & Partial<ConfigType> & {
    mode?: `${ModeEnum}`;
    fallback?: `${ModeEnum}`;
};
