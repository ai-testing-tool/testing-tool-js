"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const report_builder_js_1 = require("../report-builder.js");
const jest_js_1 = require("../jest.js");
(0, node_test_1.describe)('toJestJsonReport', () => {
    (0, node_test_1.it)('maps AggregatedResult nested testResults to assertionResults', () => {
        const report = (0, report_builder_js_1.toJestJsonReport)({
            startTime: 1_700_000_000_000,
            success: false,
            testResults: [
                {
                    testFilePath: '/tests/a.test.js',
                    testResults: [
                        {
                            ancestorTitles: ['Suite'],
                            fullName: 'Suite AUTH-101 passes',
                            title: 'AUTH-101 passes',
                            status: 'passed',
                            duration: 10,
                            failureMessages: [],
                        },
                        {
                            ancestorTitles: ['Suite'],
                            fullName: 'Suite AUTH-102 fails',
                            title: 'AUTH-102 fails',
                            status: 'failed',
                            duration: 20,
                            failureMessages: ['Expected true'],
                        },
                    ],
                },
                {
                    testFilePath: '/tests/b.test.js',
                    testResults: [
                        {
                            ancestorTitles: ['Other'],
                            fullName: 'Other skipped',
                            title: 'skipped',
                            status: 'pending',
                            duration: null,
                            failureMessages: [],
                        },
                    ],
                },
            ],
        });
        strict_1.default.equal(report.numTotalTests, 3);
        strict_1.default.equal(report.numPassedTests, 1);
        strict_1.default.equal(report.numFailedTests, 1);
        strict_1.default.equal(report.numPendingTests, 1);
        strict_1.default.equal(report.success, false);
        strict_1.default.equal(report.testResults?.length, 2);
        strict_1.default.equal(report.testResults?.[0]?.name, '/tests/a.test.js');
        strict_1.default.equal(report.testResults?.[0]?.assertionResults?.[1]?.title, 'AUTH-102 fails');
    });
    (0, node_test_1.it)('passes through native --json assertionResults shape', () => {
        const report = (0, report_builder_js_1.toJestJsonReport)({
            numTotalTests: 1,
            numPassedTests: 1,
            numFailedTests: 0,
            numPendingTests: 0,
            numTodoTests: 0,
            success: true,
            startTime: 100,
            testResults: [
                {
                    name: '/tests/c.test.js',
                    status: 'passed',
                    assertionResults: [
                        {
                            ancestorTitles: [],
                            fullName: 'AUTH-200 ok',
                            title: 'AUTH-200 ok',
                            status: 'passed',
                            duration: 5,
                            failureMessages: [],
                        },
                    ],
                },
            ],
        });
        strict_1.default.equal(report.numTotalTests, 1);
        strict_1.default.equal(report.testResults?.[0]?.name, '/tests/c.test.js');
        strict_1.default.equal(report.testResults?.[0]?.assertionResults?.[0]?.title, 'AUTH-200 ok');
    });
});
(0, node_test_1.describe)('qa helpers', () => {
    (0, node_test_1.it)('records step and suite metadata', async () => {
        (0, jest_js_1.drainQaMeta)();
        await jest_js_1.qa.suite('Auth');
        await jest_js_1.qa.step('open form', async () => undefined);
        const meta = (0, jest_js_1.drainQaMeta)();
        strict_1.default.deepEqual(meta.map((m) => m.type), ['qa-suite', 'qa-step']);
    });
});
