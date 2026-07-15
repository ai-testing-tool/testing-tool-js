import { Formatter, type IFormatterOptions } from '@cucumber/cucumber';
import { type OptionsType } from 'qa-forge-commons';
export type CucumberQaOptions = OptionsType;
export type CucumberQaFormatterOptions = IFormatterOptions & CucumberQaOptions;
/**
 * CucumberJS custom formatter for QAnalyzer.
 *
 * Configure (`cucumber.js`):
 *   format: ['progress', 'qa-forge-cucumberjs']
 *
 * Modes via env (`QANALYZER_MODE`) or formatOptions.
 * Helpers are tag-based (`@QaTitle`, `@QaSuite`, `@QaIgnore`, `@AUTH-101`) — no programmatic import (FR54).
 * `this.attach()` → envelope.attachment → optional Forge upload (FR58).
 */
export declare class CucumberQaFormatter extends Formatter {
    private readonly options;
    private readonly storage;
    private readonly byUri;
    private readonly runStart;
    private readonly pendingScenarios;
    private publishPromise;
    constructor(options: CucumberQaFormatterOptions);
    waitForPublish(): Promise<void>;
    private onEnvelope;
    private publish;
}
