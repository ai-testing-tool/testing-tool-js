import type { OptionsType } from 'qa-javascript-commons';

/**
 * Resolve qa-cypress options from Cypress reporterOptions.
 * Supports cypress-multi-reporters wrapper and direct reporter config.
 */
export function resolveQaOptions(
  reporterOptions: unknown,
): OptionsType & { resultsPath?: string } {
  if (reporterOptions == null || typeof reporterOptions !== 'object') {
    return {};
  }
  const record = reporterOptions as Record<string, unknown>;
  const wrapped = record.qaCypressReporterOptions;
  if (wrapped !== undefined && typeof wrapped === 'object' && wrapped !== null) {
    return wrapped as OptionsType & { resultsPath?: string };
  }
  return record as OptionsType & { resultsPath?: string };
}
