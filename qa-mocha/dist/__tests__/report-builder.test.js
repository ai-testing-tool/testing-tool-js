"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const qa_forge_commons_1 = require("qa-forge-commons");
const report_builder_js_1 = require("../report-builder.js");
(0, node_test_1.describe)('toJestJsonReport', () => {
    (0, node_test_1.it)('maps Mocha specs to FR41 shape A with meta.qa steps', () => {
        const wire = (0, qa_forge_commons_1.qaMetaFromEntries)([
            { type: 'qa-suite', body: 'API\tCRUD' },
            { type: 'qa-step', body: 'GET /users' },
            { type: 'qa-step-end', body: { name: 'GET /users', status: 'passed' } },
        ], { framework: 'mocha', reporter: 'qa-forge-mocha' });
        const report = (0, report_builder_js_1.toJestJsonReport)([
            {
                name: 'test/api-crud.spec.js',
                assertions: [
                    {
                        ancestorTitles: ['JSONPlaceholder User CRUD'],
                        title: 'AUTH-101 GET all users',
                        status: 'passed',
                        duration: 42,
                        failureMessages: [],
                        meta: wire ? { qa: wire } : undefined,
                    },
                    {
                        ancestorTitles: ['JSONPlaceholder User CRUD'],
                        title: 'AUTH-102 GET single user',
                        status: 'failed',
                        duration: 10,
                        failureMessages: ['Expected 200'],
                    },
                ],
            },
        ], 1_700_000_000_000);
        strict_1.default.equal(report.numTotalTests, 2);
        strict_1.default.equal(report.numPassedTests, 1);
        strict_1.default.equal(report.numFailedTests, 1);
        strict_1.default.equal(report.success, false);
        strict_1.default.equal(report.testResults?.[0]?.status, 'failed');
        const qaMeta = report.testResults?.[0]?.assertionResults?.[0]?.meta?.qa;
        strict_1.default.equal(qaMeta?.framework, 'mocha');
        strict_1.default.equal(qaMeta?.host?.reporter, 'qa-forge-mocha');
        strict_1.default.equal(qaMeta?.steps?.[0]?.name, 'GET /users');
    });
});
