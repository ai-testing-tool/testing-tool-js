"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VitestQaReporter = void 0;
const qa_javascript_commons_1 = require("qa-javascript-commons");
const report_builder_1 = require("./report-builder");
function mapState(state) {
    switch ((state ?? '').toLowerCase()) {
        case 'pass':
        case 'passed':
            return 'passed';
        case 'fail':
        case 'failed':
            return 'failed';
        case 'skip':
        case 'skipped':
            return 'skipped';
        case 'todo':
            return 'todo';
        case 'pending':
            return 'pending';
        default:
            return 'failed';
    }
}
function collectFromTestCase(testCase) {
    const result = testCase.result();
    const diagnostic = typeof testCase.diagnostic === 'function' ? testCase.diagnostic() : null;
    const errors = result?.errors ?? [];
    const failureMessages = errors.map((err) => {
        if (!err)
            return 'Test failed';
        return err.stack ?? err.message ?? String(err);
    });
    const anyCase = testCase;
    const moduleId = anyCase.moduleId ?? anyCase.file?.moduleId ?? 'unknown';
    const ancestorTitles = [];
    try {
        let current = anyCase.parent;
        const names = [];
        while (current?.name) {
            names.unshift(current.name);
            current = current.parent;
        }
        ancestorTitles.push(...names);
    }
    catch {
        // ignore suite walk failures
    }
    return {
        id: testCase.id,
        name: testCase.name,
        fullName: testCase.fullName || testCase.name,
        filePath: moduleId,
        ancestorTitles,
        status: mapState(result?.state),
        durationMs: diagnostic && typeof diagnostic.duration === 'number'
            ? Math.round(diagnostic.duration)
            : null,
        failureMessages,
        startTime: diagnostic?.startTime,
    };
}
/**
 * Vitest custom reporter for QAnalyzer.
 * Configure: `reporters: ['default', 'qa-vitest']` or `['qa-vitest', { mode: 'ingest', ... }]`.
 */
class VitestQaReporter {
    options;
    cases = [];
    startedAt = Date.now();
    publishPromise = null;
    constructor(options = {}) {
        this.options = options;
    }
    onTestCaseResult(testCase) {
        try {
            this.cases.push(collectFromTestCase(testCase));
        }
        catch {
            // Never fail the Vitest run because of reporter collection errors
        }
    }
    async onTestRunEnd() {
        if (this.publishPromise) {
            await this.publishPromise;
            return;
        }
        this.publishPromise = this.publish();
        await this.publishPromise;
    }
    async publish() {
        qa_javascript_commons_1.QAnalyzerReporter.resetInstance();
        const reporter = qa_javascript_commons_1.QAnalyzerReporter.getInstance({
            ...this.options,
            mode: this.options.mode ?? qa_javascript_commons_1.ModeEnum.off,
        });
        const mode = reporter.getConfig().mode ?? qa_javascript_commons_1.ModeEnum.off;
        if (mode === qa_javascript_commons_1.ModeEnum.off) {
            return;
        }
        const report = (0, report_builder_1.buildJestCompatibleReport)((0, report_builder_1.groupCasesByFile)(this.cases), {
            startTime: this.startedAt,
        });
        await reporter.publishReport(report, {
            format: 'vitest-json',
            launchName: this.options.launchName,
            projectKey: this.options.projectKey,
        });
    }
}
exports.VitestQaReporter = VitestQaReporter;
exports.default = VitestQaReporter;
