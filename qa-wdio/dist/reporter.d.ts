import WDIOReporter from '@wdio/reporter';
import type { SuiteStats, TestStats } from '@wdio/reporter';
import { type OptionsType } from 'qa-javascript-commons';
export type QaWdioReporterOptions = OptionsType & {
    /** Prefer programmatic `qa.step` over auto WebDriver commands (FR127). Default true. */
    disableWebdriverStepsReporting?: boolean;
    disableWebdriverScreenshotsReporting?: boolean;
    /** When true, treat suites as Cucumber scenarios and tests as Gherkin steps (FR135). */
    useCucumber?: boolean;
    outputDir?: string;
};
/**
 * WebdriverIO reporter for QAnalyzer.
 *
 * Configure:
 *   reporters: [[QaWdioReporter, { disableWebdriverStepsReporting: true }]]
 *   // Cucumber:
 *   reporters: [[QaWdioReporter, { useCucumber: true }]]
 *
 * Mocha: each `it()` → FR41 assertion; `qa.step` → `meta.qa.steps`.
 * Cucumber: each scenario suite → FR41 assertion; Gherkin steps → `meta.qa.steps` (FR135).
 */
export declare class QaWdioReporter extends WDIOReporter {
    private readonly qaOptions;
    readonly disableWebdriverStepsReporting: boolean;
    readonly disableWebdriverScreenshotsReporting: boolean;
    readonly useCucumber: boolean;
    private readonly suiteStack;
    private currentFile;
    private scenario;
    constructor(options?: QaWdioReporterOptions);
    onSuiteStart(suite: SuiteStats): void;
    onSuiteEnd(suite: SuiteStats): void;
    onTestStart(test: TestStats): void;
    onTestPass(test: TestStats): void;
    onTestFail(test: TestStats): void;
    onTestSkip(test: TestStats): void;
    onTestRetry(test: TestStats): void;
    onRunnerEnd(): Promise<void>;
    private endCucumberStep;
    private finalizeCucumberScenario;
    private record;
}
export default QaWdioReporter;
