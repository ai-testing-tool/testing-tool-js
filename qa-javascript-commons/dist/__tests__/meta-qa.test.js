"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const models_1 = require("../models");
(0, node_test_1.describe)('meta.qa enrichment', () => {
    (0, node_test_1.it)('builds wire shape from Vitest-style annotations', () => {
        const acc = (0, models_1.createQaMetaAccumulator)();
        (0, models_1.applyQaAnnotations)(acc, [
            { message: 'QA Suite: Auth\tLogin', type: 'qa-suite', body: 'Auth\tLogin' },
            { message: 'QA Fields: {"layer":"api"}', type: 'qa-fields', body: { layer: 'api' } },
            { message: 'QA IssueKey: AUTH-101', type: 'qa-issue-key', body: 'AUTH-101' },
            {
                message: 'QA IssueKeys: AUTH-10,AUTH-11',
                type: 'qa-issue-keys',
                body: ['AUTH-10', 'AUTH-11'],
            },
            { message: 'QA Step: fetch users', type: 'qa-step', body: 'fetch users' },
            { message: 'QA Step Failed: fetch users', type: 'qa-step-failed', body: { name: 'fetch users' } },
            { message: 'QA Comment: flaky env', type: 'qa-comment', body: 'flaky env' },
        ]);
        const wire = (0, models_1.toQaMetaWire)(acc, { framework: 'vitest' });
        strict_1.default.ok(wire);
        strict_1.default.equal(wire.framework, 'vitest');
        strict_1.default.deepEqual(wire.suite, [{ title: 'Auth' }, { title: 'Login' }]);
        strict_1.default.deepEqual(wire.fields, { layer: 'api' });
        strict_1.default.deepEqual(wire.issueKeys, ['AUTH-101', 'AUTH-10', 'AUTH-11']);
        strict_1.default.equal(wire.comment, 'flaky env');
        strict_1.default.equal(wire.steps?.[0]?.name, 'fetch users');
        strict_1.default.equal(wire.steps?.[0]?.status, 'failed');
        strict_1.default.equal(wire.steps?.[0]?.stepType, 'text');
        strict_1.default.equal(wire.host?.reporter, '@qanalyzer/forge-vitest');
    });
    (0, node_test_1.it)('builds wire shape from helper buffer entries', () => {
        const wire = (0, models_1.qaMetaFromEntries)([
            { type: 'qa-suite', body: 'CRUD' },
            { type: 'qa-step', body: 'create' },
            { type: 'qa-attach', body: { name: 'body.json', contentType: 'application/json' } },
        ], { framework: 'jest' });
        strict_1.default.ok(wire);
        strict_1.default.equal(wire.framework, 'jest');
        strict_1.default.deepEqual(wire.suite, [{ title: 'CRUD' }]);
        strict_1.default.equal(wire.attachments?.[0]?.file_name, 'body.json');
        strict_1.default.equal(wire.attachments?.[0]?.mime_type, 'application/json');
    });
    (0, node_test_1.it)('returns undefined for empty accumulator', () => {
        strict_1.default.equal((0, models_1.toQaMetaWire)((0, models_1.createQaMetaAccumulator)(), { framework: 'vitest' }), undefined);
    });
    (0, node_test_1.it)('preserves meta.qa through normalizeJestReport and buildIngestPayload (FR141)', () => {
        const qa = (0, models_1.toQaMetaWire)((() => {
            const acc = (0, models_1.createQaMetaAccumulator)();
            (0, models_1.applyQaAnnotations)(acc, [{ type: 'qa-step', body: 'open form' }]);
            return acc;
        })(), { framework: 'vitest' });
        const report = (0, models_1.normalizeJestReport)({
            numTotalTests: 1,
            numPassedTests: 1,
            numFailedTests: 0,
            success: true,
            testResults: [
                {
                    name: '/t.test.ts',
                    status: 'passed',
                    assertionResults: [
                        {
                            title: 'AUTH-101',
                            fullName: 'AUTH-101',
                            status: 'passed',
                            meta: { qa },
                        },
                    ],
                },
            ],
        });
        const payload = (0, models_1.buildIngestPayload)({
            projectKey: 'AUTH',
            report,
            format: 'vitest-json',
        });
        strict_1.default.deepEqual(payload.report.testResults?.[0]?.assertionResults?.[0]?.meta?.qa, qa);
    });
});
