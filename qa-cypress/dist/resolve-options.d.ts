import type { OptionsType } from 'qa-javascript-commons';
/**
 * Resolve qa-cypress options from Cypress reporterOptions.
 * Supports cypress-multi-reporters wrapper and direct reporter config.
 */
export declare function resolveQaOptions(reporterOptions: unknown): OptionsType & {
    resultsPath?: string;
};
