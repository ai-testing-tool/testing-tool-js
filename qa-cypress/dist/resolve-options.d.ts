import type { OptionsType } from 'qa-forge-commons';
/**
 * Resolve qa-forge-cypress options from Cypress reporterOptions.
 * Supports cypress-multi-reporters wrapper and direct reporter config.
 */
export declare function resolveQaOptions(reporterOptions: unknown): OptionsType & {
    resultsPath?: string;
};
