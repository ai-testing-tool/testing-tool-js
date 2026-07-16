import { reporters, Runner, type MochaOptions } from 'mocha';
import { type OptionsType } from '@qanalyzer/forge-commons';
export type CypressQaOptions = OptionsType & {
    /** Override results bridge path (also QANALYZER_CYPRESS_RESULTS_PATH). */
    resultsPath?: string;
};
export type CypressQaReporterOptions = Omit<MochaOptions, 'reporterOptions'> & {
    reporterOptions?: CypressQaOptions;
};
/**
 * Cypress Mocha reporter for QAnalyzer.
 *
 * Collects per-`it()` results + `qa.*` metadata, appends to ResultsManager.
 * Plugin `after:run` publishes FR41 (mode=ingest|file). mode=off no-ops.
 */
export declare class CypressQaReporter extends reporters.Base {
    private readonly options;
    private readonly byFile;
    private readonly runStart;
    constructor(runner: Runner, options?: CypressQaReporterOptions);
    private record;
    private flushToResultsManager;
}
export default CypressQaReporter;
