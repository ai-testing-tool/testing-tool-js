import { reporters, Runner, type MochaOptions } from 'mocha';
import { type OptionsType } from '@qanalyzer/forge-commons';
export type MochaQaOptions = OptionsType;
export type MochaQaReporterOptions = Omit<MochaOptions, 'reporterOptions'> & {
    reporterOptions?: MochaQaOptions;
};
/**
 * Mocha custom reporter for QAnalyzer.
 *
 * Configure: `.mocharc.js` → `reporter: '@qanalyzer/forge-mocha'`
 * Options: `reporterOptions: { mode: 'ingest' | 'file' | 'off', … }`
 * Env: `QANALYZER_MODE`, `QANALYZER_PROJECT_KEY`, …
 *
 * Helpers from `@qanalyzer/forge-mocha/mocha` forward metadata via a global bridge.
 */
export declare class MochaQaReporter extends reporters.Spec {
    private readonly options;
    private readonly bridgeBuffer;
    private readonly byFile;
    private readonly runStart;
    private publishPromise;
    constructor(runner: Runner, options?: MochaQaReporterOptions);
    /** Await in-process publish (tests / programmatic runs). */
    waitForPublish(): Promise<void>;
    private installBridge;
    private record;
    private publish;
}
