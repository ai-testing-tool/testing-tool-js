"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const node_test_1 = require("node:test");
const qa_javascript_commons_1 = require("qa-javascript-commons");
const report_builder_js_1 = require("../report-builder.js");
function loadSaucedemoFixture() {
    const raw = JSON.parse((0, node_fs_1.readFileSync)((0, node_path_1.join)(__dirname, '../__fixtures__/saucedemo-13.json'), 'utf8'));
    return raw.specs.map((spec) => ({
        name: spec.name,
        assertions: spec.assertions.map((a) => {
            const entries = [];
            for (const step of a.steps ?? []) {
                entries.push({ type: 'qa-step-start', body: step });
                entries.push({ type: 'qa-step-end', body: { name: step, status: 'passed' } });
            }
            if (a.ignore) {
                entries.push({ type: 'qa-ignore', body: true });
            }
            const wire = (0, qa_javascript_commons_1.qaMetaFromEntries)(entries, {
                framework: 'wdio',
                reporter: 'qa-wdio',
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
(0, node_test_1.describe)('toJestJsonReport (FR124 / FR134)', () => {
    (0, node_test_1.it)('normalizes saucedemo fixture to 13 tests with AUTH keys and steps', () => {
        const specs = loadSaucedemoFixture();
        const report = (0, report_builder_js_1.toJestJsonReport)(specs, 1_700_000_000_000);
        strict_1.default.equal(report.numTotalTests, 13);
        strict_1.default.equal(report.numPassedTests, 12);
        strict_1.default.equal(report.numPendingTests, 1);
        strict_1.default.equal(report.success, true);
        strict_1.default.equal(report.testResults?.length, 4);
        const titles = (report.testResults ?? []).flatMap((f) => (f.assertionResults ?? []).map((a) => a.title));
        strict_1.default.ok(titles.some((t) => t?.includes('AUTH-101')));
        strict_1.default.ok(titles.some((t) => t?.includes('AUTH-113')));
        const login = report.testResults?.[0]?.assertionResults?.[0];
        const loginQa = login?.meta?.qa;
        strict_1.default.equal(loginQa?.framework, 'wdio');
        strict_1.default.ok((loginQa?.steps?.length ?? 0) >= 1);
        const ignored = report.testResults
            ?.flatMap((f) => f.assertionResults ?? [])
            .find((a) => a.title?.includes('AUTH-113'));
        const ignoredQa = ignored?.meta?.qa;
        strict_1.default.equal(ignoredQa?.ignore, true);
    });
});
(0, node_test_1.describe)('qa.step → meta.qa.steps (FR125)', () => {
    (0, node_test_1.it)('preserves nested step order via qaMetaFromEntries', () => {
        const wire = (0, qa_javascript_commons_1.qaMetaFromEntries)([
            { type: 'qa-step-start', body: 'outer' },
            { type: 'qa-step-start', body: 'inner' },
            { type: 'qa-step-end', body: { name: 'inner', status: 'passed' } },
            { type: 'qa-step-end', body: { name: 'outer', status: 'passed' } },
            { type: 'qa-suite', body: 'E-commerce\tLogin' },
        ], { framework: 'wdio', reporter: 'qa-wdio' });
        strict_1.default.ok(wire);
        strict_1.default.equal(wire?.framework, 'wdio');
        strict_1.default.equal(wire?.steps?.length, 2);
        strict_1.default.equal(wire?.steps?.[0]?.name, 'outer');
        strict_1.default.equal(wire?.steps?.[1]?.name, 'inner');
        strict_1.default.deepEqual(wire?.suite, [{ title: 'E-commerce' }, { title: 'Login' }]);
    });
});
