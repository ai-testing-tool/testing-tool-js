import { type OptionsType } from '@ai-testing-tool/forge-commons';
import { type AggregatedResultLike } from './report-builder';
export type JestQaOptions = OptionsType;
type JestTestCaseResultLike = {
    fullName?: string;
    title?: string;
};
/**
 * Jest custom reporter for AiTestingTool.
 * Configure: `reporters: ['default', '@ai-testing-tool/forge-jest']` or `['@ai-testing-tool/forge-jest', { mode: 'ingest', ... }]`.
 *
 * Helpers from `@ai-testing-tool/forge-jest/jest` forward metadata via a global bridge (works with `--runInBand`).
 */
export declare class JestQaReporter {
    private readonly options;
    private publishPromise;
    private readonly bridgeBuffer;
    private readonly metaByFullName;
    constructor(_globalConfig: unknown, options?: JestQaOptions);
    private installBridge;
    onTestCaseStart(_test: unknown, testCaseStartInfo: JestTestCaseResultLike): void;
    onTestCaseResult(_test: unknown, testCaseResult: JestTestCaseResultLike): void;
    onRunComplete(_testContexts: unknown, results: AggregatedResultLike): Promise<void>;
    private publish;
}
export default JestQaReporter;
