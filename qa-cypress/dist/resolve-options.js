"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveQaOptions = resolveQaOptions;
/**
 * Resolve qa-cypress options from Cypress reporterOptions.
 * Supports cypress-multi-reporters wrapper and direct reporter config.
 */
function resolveQaOptions(reporterOptions) {
    if (reporterOptions == null || typeof reporterOptions !== 'object') {
        return {};
    }
    const record = reporterOptions;
    const wrapped = record.qaCypressReporterOptions;
    if (wrapped !== undefined && typeof wrapped === 'object' && wrapped !== null) {
        return wrapped;
    }
    return record;
}
