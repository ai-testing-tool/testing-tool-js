import type { OptionsType } from '@ai-testing-tool/forge-commons';
/**
 * Resolve @ai-testing-tool/forge-cypress options from Cypress reporterOptions.
 * Supports cypress-multi-reporters wrapper and direct reporter config.
 */
export declare function resolveQaOptions(reporterOptions: unknown): OptionsType & {
    resultsPath?: string;
};
