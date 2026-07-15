import type { OptionsType } from 'qa-forge-commons';
import type { WdioSpecInput } from './report-builder';
/**
 * In-process collection of specs for publish from reporter and/or afterRunHook.
 */
export declare const ResultsBuffer: {
    options: OptionsType;
    runStart: number;
    specs: WdioSpecInput[];
    published: boolean;
    reset(options?: OptionsType): void;
    setOptions(options: OptionsType): void;
    appendSpec(spec: WdioSpecInput): void;
    /** Merge assertions into an existing file bucket or create one. */
    appendAssertion(file: string, assertion: WdioSpecInput["assertions"][number]): void;
    takeSpecs(): WdioSpecInput[];
};
