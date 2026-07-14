"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_fs_1 = require("node:fs");
const node_os_1 = require("node:os");
const node_path_1 = require("node:path");
const node_test_1 = require("node:test");
const qa_javascript_commons_1 = require("qa-javascript-commons");
const index_js_1 = require("../index.js");
const report_builder_js_1 = require("../report-builder.js");
/** Same logical run as AggregatedResult (onRunComplete) vs native --json output. */
const AGGREGATED = {
    startTime: 1_700_000_000_000,
    success: false,
    numTotalTestSuites: 1,
    numPassedTestSuites: 0,
    numFailedTestSuites: 1,
    numPendingTestSuites: 0,
    numTotalTests: 2,
    numPassedTests: 1,
    numFailedTests: 1,
    numPendingTests: 0,
    numTodoTests: 0,
    testResults: [
        {
            testFilePath: '/tests/auth.test.js',
            status: 'failed',
            startTime: 1_700_000_000_000,
            endTime: 1_700_000_000_050,
            testResults: [
                {
                    ancestorTitles: ['Auth'],
                    fullName: 'Auth AUTH-101 login',
                    title: 'AUTH-101 login',
                    status: 'passed',
                    duration: 12,
                    failureMessages: [],
                },
                {
                    ancestorTitles: ['Auth'],
                    fullName: 'Auth AUTH-102 logout',
                    title: 'AUTH-102 logout',
                    status: 'failed',
                    duration: 8,
                    failureMessages: ['Expected 200'],
                },
            ],
        },
    ],
};
const NATIVE_JSON = {
    startTime: 1_700_000_000_000,
    success: false,
    numTotalTestSuites: 1,
    numPassedTestSuites: 0,
    numFailedTestSuites: 1,
    numPendingTestSuites: 0,
    numTotalTests: 2,
    numPassedTests: 1,
    numFailedTests: 1,
    numPendingTests: 0,
    numTodoTests: 0,
    testResults: [
        {
            name: '/tests/auth.test.js',
            status: 'failed',
            startTime: 1_700_000_000_000,
            endTime: 1_700_000_000_050,
            assertionResults: [
                {
                    ancestorTitles: ['Auth'],
                    fullName: 'Auth AUTH-101 login',
                    title: 'AUTH-101 login',
                    status: 'passed',
                    duration: 12,
                    failureMessages: [],
                },
                {
                    ancestorTitles: ['Auth'],
                    fullName: 'Auth AUTH-102 logout',
                    title: 'AUTH-102 logout',
                    status: 'failed',
                    duration: 8,
                    failureMessages: ['Expected 200'],
                },
            ],
        },
    ],
};
function assertionFingerprint(payload) {
    const rows = [];
    const report = typeof payload.report === 'object' && payload.report
        ? payload.report
        : null;
    for (const file of report?.testResults ?? []) {
        for (const a of file.assertionResults ?? []) {
            rows.push(`${file.name}|${a.fullName}|${a.title}|${a.status}`);
        }
    }
    return rows.sort();
}
(0, node_test_1.describe)('dual-path FR41 parity (NFR24)', () => {
    (0, node_test_1.it)('AggregatedResult and native --json yield schema-equivalent payloads', () => {
        const fromReporter = (0, qa_javascript_commons_1.buildIngestPayload)({
            projectKey: 'AUTH',
            report: (0, report_builder_js_1.toJestJsonReport)(AGGREGATED),
            format: 'jest-json',
            launchName: 'ci #1',
        });
        const fromCli = (0, qa_javascript_commons_1.buildIngestPayload)({
            projectKey: 'AUTH',
            report: (0, report_builder_js_1.toJestJsonReport)(NATIVE_JSON),
            format: 'jest-json',
            launchName: 'ci #1',
        });
        strict_1.default.equal(fromReporter.format, 'jest-json');
        strict_1.default.equal(fromCli.format, 'jest-json');
        strict_1.default.equal(fromReporter.projectKey, fromCli.projectKey);
        strict_1.default.equal(fromReporter.launchName, fromCli.launchName);
        strict_1.default.equal(fromReporter.report.numTotalTests, fromCli.report.numTotalTests);
        strict_1.default.equal(fromReporter.report.numPassedTests, fromCli.report.numPassedTests);
        strict_1.default.equal(fromReporter.report.numFailedTests, fromCli.report.numFailedTests);
        strict_1.default.equal(fromReporter.report.success, fromCli.report.success);
        strict_1.default.deepEqual(assertionFingerprint(fromReporter), assertionFingerprint(fromCli));
    });
});
(0, node_test_1.describe)('mode=file publish', () => {
    (0, node_test_1.it)('writes FR41 payload with format jest-json', async () => {
        const dir = (0, node_fs_1.mkdtempSync)((0, node_path_1.join)((0, node_os_1.tmpdir)(), 'qa-jest-'));
        const out = (0, node_path_1.join)(dir, 'qanalyzer-results.json');
        try {
            qa_javascript_commons_1.QAnalyzerReporter.resetInstance();
            const reporter = qa_javascript_commons_1.QAnalyzerReporter.getInstance({
                mode: qa_javascript_commons_1.ModeEnum.file,
                projectKey: 'AUTH',
                launchName: 'local',
                file: { path: out },
            });
            const payload = await reporter.publishReport((0, report_builder_js_1.toJestJsonReport)(AGGREGATED), {
                format: 'jest-json',
            });
            strict_1.default.ok(payload);
            strict_1.default.equal(payload.format, 'jest-json');
            const written = JSON.parse((0, node_fs_1.readFileSync)(out, 'utf8'));
            strict_1.default.equal(written.format, 'jest-json');
            strict_1.default.equal(written.projectKey, 'AUTH');
            strict_1.default.equal(written.report.testResults?.[0]?.assertionResults?.[0]?.title, 'AUTH-101 login');
        }
        finally {
            qa_javascript_commons_1.QAnalyzerReporter.resetInstance();
            (0, node_fs_1.rmSync)(dir, { recursive: true, force: true });
        }
    });
});
(0, node_test_1.describe)('JestQaReporter modes', () => {
    (0, node_test_1.it)('mode=off completes without credentials', async () => {
        const reporter = new index_js_1.JestQaReporter({}, { mode: qa_javascript_commons_1.ModeEnum.off });
        await reporter.onRunComplete(new Set(), AGGREGATED);
    });
    (0, node_test_1.it)('mode=file via reporter writes payload', async () => {
        const dir = (0, node_fs_1.mkdtempSync)((0, node_path_1.join)((0, node_os_1.tmpdir)(), 'qa-jest-rep-'));
        const out = (0, node_path_1.join)(dir, 'out.json');
        try {
            const reporter = new index_js_1.JestQaReporter({}, {
                mode: qa_javascript_commons_1.ModeEnum.file,
                projectKey: 'AUTH',
                file: { path: out },
            });
            await reporter.onRunComplete(new Set(), AGGREGATED);
            const written = JSON.parse((0, node_fs_1.readFileSync)(out, 'utf8'));
            strict_1.default.equal(written.format, 'jest-json');
            strict_1.default.equal(written.projectKey, 'AUTH');
        }
        finally {
            qa_javascript_commons_1.QAnalyzerReporter.resetInstance();
            (0, node_fs_1.rmSync)(dir, { recursive: true, force: true });
        }
    });
});
