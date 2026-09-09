import type { ConfigType } from '../config';
import { ModeEnum, type OptionsType } from '../options';
import { type InternalReporterInterface } from '../reporters';
import { type LoggerInterface } from '../utils';
export declare class ReporterFactory {
    private readonly logger;
    constructor(logger: LoggerInterface);
    create(mode: ModeEnum, options: ConfigType & OptionsType): InternalReporterInterface;
    private createIngest;
    private createFile;
}
