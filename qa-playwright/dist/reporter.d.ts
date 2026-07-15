import type { FullConfig, FullResult, Reporter, Suite, TestCase, TestResult, TestStep } from '@playwright/test/reporter';
import { type OptionsType } from 'qa-forge-commons';
export type PlaywrightQaOptions = OptionsType;
/**
 * Playwright reporter for QAnalyzer.
 *
 * Configure:
 *   reporter: [['list'], ['qa-forge-playwright', { mode: 'off' }]]
 *
 * Collects each test → FR41 shape A; native `test.step` → `meta.qa.steps`.
 * On failure, still-image attachments are uploaded via Forge (FR119).
 */
export declare class PlaywrightQaReporter implements Reporter {
    private readonly options;
    private readonly byFile;
    private readonly runStart;
    private readonly pendingUploads;
    private publishPromise;
    constructor(options?: PlaywrightQaOptions);
    onBegin(_config: FullConfig, _suite: Suite): void;
    onStepBegin(_test: TestCase, _result: TestResult, _step: TestStep): void;
    onTestEnd(test: TestCase, result: TestResult): void;
    onEnd(_result: FullResult): Promise<void>;
    private publish;
}
export default PlaywrightQaReporter;
