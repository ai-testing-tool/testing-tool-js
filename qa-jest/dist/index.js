"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JestQaReporter = void 0;
const qa_javascript_commons_1 = require("qa-javascript-commons");
const report_builder_1 = require("./report-builder");
/**
 * Jest custom reporter for QAnalyzer.
 * Configure: `reporters: ['default', 'qa-jest']` or `['qa-jest', { mode: 'ingest', ... }]`.
 *
 * Helpers from `qa-jest/jest` forward metadata via a global bridge (works with `--runInBand`).
 */
class JestQaReporter {
    options;
    publishPromise = null;
    bridgeBuffer = [];
    metaByFullName = new Map();
    constructor(_globalConfig, options = {}) {
        this.options = options ?? {};
        this.installBridge();
    }
    installBridge() {
        const bridge = {
            push: (entry) => {
                this.bridgeBuffer.push(entry);
            },
            drain: () => {
                const copy = [...this.bridgeBuffer];
                this.bridgeBuffer.length = 0;
                return copy;
            },
            currentTitle: undefined,
        };
        globalThis.__QA_JEST_BRIDGE__ = bridge;
    }
    onTestCaseStart(_test, testCaseStartInfo) {
        try {
            if (globalThis.__QA_JEST_BRIDGE__) {
                globalThis.__QA_JEST_BRIDGE__.currentTitle =
                    testCaseStartInfo.fullName ?? testCaseStartInfo.title;
            }
        }
        catch {
            // never fail
        }
    }
    onTestCaseResult(_test, testCaseResult) {
        try {
            const entries = this.bridgeBuffer.splice(0, this.bridgeBuffer.length);
            const wire = (0, qa_javascript_commons_1.qaMetaFromEntries)(entries, { framework: 'jest' });
            const key = testCaseResult.fullName ?? testCaseResult.title;
            if (wire && key) {
                this.metaByFullName.set(key, wire);
            }
        }
        catch {
            // Never fail the Jest run because of metadata collection
        }
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
            // Jest finalizes aggregatedResults.success *after* dispatching onRunComplete
            // (it folds in reporter errors), so reporters always see a stale `false`.
            // Drop it and let the builder derive success from failure counts.
            const report = (0, report_builder_1.toJestJsonReport)({ ...results, success: undefined }, this.metaByFullName);
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
