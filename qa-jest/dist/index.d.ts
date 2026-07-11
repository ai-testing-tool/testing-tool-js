import { type OptionsType } from 'qa-javascript-commons';
import { type AggregatedResultLike } from './report-builder';
export type JestQaOptions = OptionsType;
/**
 * Jest custom reporter for QAnalyzer.
 * Configure: `reporters: ['default', 'qa-jest']` or `['qa-jest', { mode: 'ingest', ... }]`.
 */
export declare class JestQaReporter {
    private readonly options;
    private publishPromise;
    constructor(_globalConfig: unknown, options?: JestQaOptions);
    onRunComplete(_testContexts: unknown, results: AggregatedResultLike): Promise<void>;
    private publish;
}
export default JestQaReporter;
