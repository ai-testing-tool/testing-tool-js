"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const node_test_1 = require("node:test");
const forge_commons_1 = require("@qanalyzer/forge-commons");
const report_builder_js_1 = require("../report-builder.js");
function loadSaucedemoFixture() {
    const raw = JSON.parse((0, node_fs_1.readFileSync)((0, node_path_1.join)(__dirname, '../__fixtures__/saucedemo-13.json'), 'utf8'));
    return raw.specs.map((spec) => ({
        name: spec.name,
        assertions: spec.assertions.map((a) => {
            const entries = [];
            for (const step of a.steps ?? []) {
                entries.push({ type: 'qa-step', body: step });
                entries.push({ type: 'qa-step-end', body: { name: step, status: 'passed' } });
            }
            if (a.ignore) {
                entries.push({ type: 'qa-ignore', body: true });
            }
            const wire = (0, forge_commons_1.qaMetaFromEntries)(entries, {
                framework: 'cypress',
                reporter: '@qanalyzer/forge-cypress',
            });
            return {
                ancestorTitles: a.ancestorTitles,
                title: a.title,
                status: a.status,
                duration: a.duration,
                failureMessages: [],
                meta: wire ? { qa: wire } : undefined,
            };
        }),
    }));
}
(0, node_test_1.describe)('toJestJsonReport', () => {
    (0, node_test_1.it)('maps Mocha-like specs to FR41 shape A with meta.qa steps', () => {
        const wire = (0, forge_commons_1.qaMetaFromEntries)([
            { type: 'qa-suite', body: 'E-commerce\tLogin' },
            { type: 'qa-step', body: 'Fill in username' },
            { type: 'qa-step-end', body: { name: 'Fill in username', status: 'passed' } },
        ], { framework: 'cypress', reporter: '@qanalyzer/forge-cypress' });
        const report = (0, report_builder_js_1.toJestJsonReport)([
            {
                name: 'cypress/e2e/login.cy.js',
                assertions: [
                    {
                        ancestorTitles: ['Login Scenarios'],
                        title: 'AUTH-101 User can login with valid credentials',
                        status: 'passed',
                        duration: 10,
                        meta: wire ? { qa: wire } : undefined,
                    },
                    {
                        ancestorTitles: ['Login Scenarios'],
                        title: 'AUTH-102 fails',
                        status: 'failed',
                        duration: 5,
                        failureMessages: ['Timed out retrying'],
                    },
                ],
            },
        ], 1_700_000_000_000);
        strict_1.default.equal(report.numTotalTests, 2);
        strict_1.default.equal(report.numPassedTests, 1);
        strict_1.default.equal(report.numFailedTests, 1);
        strict_1.default.equal(report.success, false);
        strict_1.default.equal(report.testResults?.[0]?.assertionResults?.[0]?.title, 'AUTH-101 User can login with valid credentials');
        strict_1.default.equal(report.testResults?.[0]?.assertionResults?.[0]?.meta?.qa
            ?.framework, 'cypress');
        strict_1.default.equal(report.testResults?.[0]?.assertionResults?.[0]?.meta?.qa
            ?.steps?.length, 1);
    });
});
(0, node_test_1.describe)('saucedemo fixture (FR69)', () => {
    (0, node_test_1.it)('normalizes 13 reference tests with counts and AUTH titles', () => {
        const specs = loadSaucedemoFixture();
        const report = (0, report_builder_js_1.toJestJsonReport)(specs, 1_700_000_000_000);
        strict_1.default.equal(report.numTotalTestSuites, 4);
        strict_1.default.equal(report.numTotalTests, 13);
        strict_1.default.equal(report.numPassedTests, 12);
        strict_1.default.equal(report.numPendingTests, 1);
        strict_1.default.equal(report.numFailedTests, 0);
        strict_1.default.equal(report.success, true);
        const titles = [];
        for (const file of report.testResults ?? []) {
            for (const a of file.assertionResults ?? []) {
                titles.push(String(a.title));
            }
        }
        strict_1.default.equal(titles.length, 13);
        strict_1.default.ok(titles.every((t) => /^AUTH-\d+/.test(t)));
        strict_1.default.ok(titles.includes('AUTH-101 User can login with valid credentials'));
        strict_1.default.ok(titles.includes('AUTH-113 Demo test that will be ignored in reporting'));
        const login = report.testResults?.find((f) => f.name?.includes('login'));
        const firstQa = login?.assertionResults?.[0]?.meta?.qa;
        strict_1.default.ok(firstQa?.steps && firstQa.steps.length >= 3);
    });
});
