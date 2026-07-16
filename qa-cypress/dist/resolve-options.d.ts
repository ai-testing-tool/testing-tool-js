import type { OptionsType } from '@qanalyzer/forge-commons';
/**
 * Resolve @qanalyzer/forge-cypress options from Cypress reporterOptions.
 * Supports cypress-multi-reporters wrapper and direct reporter config.
 */
export declare function resolveQaOptions(reporterOptions: unknown): OptionsType & {
    resultsPath?: string;
};
