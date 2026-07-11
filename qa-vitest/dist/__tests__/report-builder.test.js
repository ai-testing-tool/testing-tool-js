"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const report_builder_js_1 = require("../report-builder.js");
(0, node_test_1.describe)('buildJestCompatibleReport', () => {
    (0, node_test_1.it)('maps collected cases to Jest-compatible JSON with counts', () => {
        const report = (0, report_builder_js_1.buildJestCompatibleReport)((0, report_builder_js_1.groupCasesByFile)([
            {
                id: '1',
                name: 'AUTH-101 passes',
                fullName: 'Suite AUTH-101 passes',
                filePath: '/tests/a.test.ts',
                ancestorTitles: ['Suite'],
                status: 'passed',
                durationMs: 10,
                failureMessages: [],
            },
            {
                id: '2',
                name: 'AUTH-102 fails',
                fullName: 'Suite AUTH-102 fails',
                filePath: '/tests/a.test.ts',
                ancestorTitles: ['Suite'],
                status: 'failed',
                durationMs: 20,
                failureMessages: ['Unable to find an accessible element'],
            },
            {
                id: '3',
                name: 'skipped',
                fullName: 'Other skipped',
                filePath: '/tests/b.test.ts',
                ancestorTitles: ['Other'],
                status: 'skipped',
                durationMs: null,
                failureMessages: [],
            },
        ]), { startTime: 1_700_000_000_000 });
        strict_1.default.equal(report.numTotalTests, 3);
        strict_1.default.equal(report.numPassedTests, 1);
        strict_1.default.equal(report.numFailedTests, 1);
        strict_1.default.equal(report.numPendingTests, 1);
        strict_1.default.equal(report.success, false);
        strict_1.default.equal(report.testResults?.length, 2);
        strict_1.default.equal(report.testResults?.[0]?.assertionResults?.[1]?.title, 'AUTH-102 fails');
    });
});
