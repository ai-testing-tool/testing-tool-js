import type { Reporter } from 'vitest/reporters';
import type { TestCase } from 'vitest/node';
import { type OptionsType } from 'qa-forge-commons';
export type VitestQaOptions = OptionsType;
/**
 * Vitest custom reporter for QAnalyzer.
 * Configure: `reporters: ['default', 'qa-forge-vitest']` or `['qa-forge-vitest', { mode: 'ingest', ... }]`.
 */
export declare class VitestQaReporter implements Reporter {
    private readonly options;
    private readonly cases;
    private readonly startedAt;
    private publishPromise;
    constructor(options?: VitestQaOptions);
    onTestCaseResult(testCase: TestCase): void;
    onTestRunEnd(): Promise<void>;
    private publish;
}
export default VitestQaReporter;
