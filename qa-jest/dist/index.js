"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JestQaReporter = void 0;
const qa_javascript_commons_1 = require("qa-javascript-commons");
const report_builder_1 = require("./report-builder");
/**
 * Jest custom reporter for QAnalyzer.
 * Configure: `reporters: ['default', 'qa-jest']` or `['qa-jest', { mode: 'ingest', ... }]`.
 */
class JestQaReporter {
    options;
    publishPromise = null;
    constructor(_globalConfig, options = {}) {
        this.options = options ?? {};
    }
    async onRunComplete(_testContexts, results) {
        if (this.publishPromise) {
            await this.publishPromise;
            return;
        }
        this.publishPromise = this.publish(results);
        await this.publishPromise;
    }
    async publish(results) {
        try {
            qa_javascript_commons_1.QAnalyzerReporter.resetInstance();
            const reporter = qa_javascript_commons_1.QAnalyzerReporter.getInstance({
                ...this.options,
                mode: this.options.mode ?? qa_javascript_commons_1.ModeEnum.off,
            });
            const mode = reporter.getConfig().mode ?? qa_javascript_commons_1.ModeEnum.off;
            if (mode === qa_javascript_commons_1.ModeEnum.off) {
                return;
            }
            const report = (0, report_builder_1.toJestJsonReport)(results);
            await reporter.publishReport(report, {
                format: 'jest-json',
                launchName: this.options.launchName,
                projectKey: this.options.projectKey,
            });
        }
        catch {
            // Never fail the Jest run because of reporter publish errors
        }
    }
}
exports.JestQaReporter = JestQaReporter;
exports.default = JestQaReporter;
