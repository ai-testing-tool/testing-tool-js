import { reporters, Runner, type MochaOptions } from 'mocha';
import { type OptionsType } from '@ai-testing-tool/forge-commons';
export type MochaQaOptions = OptionsType;
export type MochaQaReporterOptions = Omit<MochaOptions, 'reporterOptions'> & {
    reporterOptions?: MochaQaOptions;
};
/**
 * Mocha custom reporter for AiTestingTool.
 *
 * Configure: `.mocharc.js` → `reporter: '@ai-testing-tool/forge-mocha'`
 * Options: `reporterOptions: { mode: 'ingest' | 'file' | 'off', … }`
 * Env: `AI_TESTING_TOOL_MODE`, `AI_TESTING_TOOL_PROJECT_KEY`, …
 *
 * Helpers from `@ai-testing-tool/forge-mocha/mocha` forward metadata via a global bridge.
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
