/**
 * WDIO service for QAnalyzer (FR123).
 *
 * Register: `services: [[QaWdioService, { disableWebdriverScreenshotsReporting: false }]]`
 *
 * On test failure, captures a still-image screenshot (no video) and uploads via
 * Forge when configured (FR133). Cucumber: `afterScenario` (FR135). Never fails the WDIO run.
 */
export type QaWdioServiceOptions = {
    /** When true (default), skip automatic failure screenshots. */
    disableWebdriverScreenshotsReporting?: boolean;
};
type AfterTestResult = {
    passed?: boolean;
    error?: Error;
};
type TestLike = {
    title?: string;
    fullTitle?: string | (() => string);
};
type ScenarioLike = {
    title?: string;
    name?: string;
    tags?: Array<{
        name?: string;
    } | string>;
};
type WorldLike = {
    passed?: boolean;
    error?: Error;
};
export declare class QaWdioService {
    private readonly disableScreenshots;
    constructor(options?: QaWdioServiceOptions);
    before(): void;
    beforeTest(): void;
    afterTest(test: TestLike, _context: unknown, result: AfterTestResult): Promise<void>;
    /**
     * Cucumber / Gherkin failure still-image (FR135 + FR133).
     * WDIO cucumber framework invokes this after each scenario.
     */
    afterScenario(world: WorldLike, result: {
        passed?: boolean;
        error?: Error;
    } | undefined, scenario: ScenarioLike): Promise<void>;
    after(): void;
}
export {};
