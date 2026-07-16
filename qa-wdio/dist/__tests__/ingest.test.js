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
const forge_commons_1 = require("@qanalyzer/forge-commons");
const helpers_js_1 = require("../helpers.js");
const hooks_js_1 = require("../hooks.js");
const reporter_js_1 = require("../reporter.js");
const report_builder_js_1 = require("../report-builder.js");
const results_buffer_js_1 = require("../results-buffer.js");
(0, node_test_1.describe)('mode=file publish', () => {
    (0, node_test_1.it)('writes FR41 payload with format jest-json', async () => {
        const dir = (0, node_fs_1.mkdtempSync)((0, node_path_1.join)((0, node_os_1.tmpdir)(), 'qa-wdio-'));
        const out = (0, node_path_1.join)(dir, 'qanalyzer-results.json');
        try {
            forge_commons_1.QAnalyzerReporter.resetInstance();
            const reporter = forge_commons_1.QAnalyzerReporter.getInstance({
                mode: forge_commons_1.ModeEnum.file,
                projectKey: 'AUTH',
                launchName: 'local',
                file: { path: out },
            });
            const payload = await reporter.publishReport((0, report_builder_js_1.toJestJsonReport)([
                {
                    name: 'test/specs/login.spec.js',
                    assertions: [
                        {
                            ancestorTitles: ['Login'],
                            title: 'AUTH-101 login',
                            status: 'passed',
                            duration: 12,
                        },
                    ],
                },
            ]), { format: 'jest-json' });
            strict_1.default.ok(payload);
            strict_1.default.equal(payload.format, 'jest-json');
            const written = JSON.parse((0, node_fs_1.readFileSync)(out, 'utf8'));
            strict_1.default.equal(written.projectKey, 'AUTH');
            strict_1.default.equal(written.report.testResults?.[0]?.assertionResults?.[0]?.title, 'AUTH-101 login');
        }
        finally {
            forge_commons_1.QAnalyzerReporter.resetInstance();
            (0, node_fs_1.rmSync)(dir, { recursive: true, force: true });
        }
    });
});
(0, node_test_1.describe)('QaWdioReporter modes', () => {
    (0, node_test_1.it)('mode=off completes without credentials', async () => {
        forge_commons_1.QAnalyzerReporter.resetInstance();
        hooks_js_1.hooksLifecycle.reset();
        results_buffer_js_1.ResultsBuffer.reset({ mode: forge_commons_1.ModeEnum.off });
        await (0, hooks_js_1.beforeRunHook)({ mode: forge_commons_1.ModeEnum.off });
        const reporter = new reporter_js_1.QaWdioReporter({ mode: forge_commons_1.ModeEnum.off });
        reporter.onTestStart({ title: 'AUTH-101' });
        reporter.onTestPass({
            title: 'AUTH-101',
            parent: 'Login',
            duration: 1,
            errors: [],
        });
        await reporter.onRunnerEnd();
        await (0, hooks_js_1.afterRunHook)();
    });
    (0, node_test_1.it)('mode=file via reporter writes payload with qa.step hierarchy', async () => {
        const dir = (0, node_fs_1.mkdtempSync)((0, node_path_1.join)((0, node_os_1.tmpdir)(), 'qa-wdio-rep-'));
        const out = (0, node_path_1.join)(dir, 'out.json');
        try {
            forge_commons_1.QAnalyzerReporter.resetInstance();
            hooks_js_1.hooksLifecycle.reset();
            results_buffer_js_1.ResultsBuffer.reset();
            await (0, hooks_js_1.beforeRunHook)({
                mode: forge_commons_1.ModeEnum.file,
                projectKey: 'AUTH',
                file: { path: out },
            });
            const reporter = new reporter_js_1.QaWdioReporter({
                mode: forge_commons_1.ModeEnum.file,
                projectKey: 'AUTH',
                file: { path: out },
            });
            reporter.onSuiteStart({
                uid: 's1',
                title: 'Login Scenarios',
                file: '/test/specs/login.spec.js',
            });
            reporter.onTestStart({ title: 'AUTH-101 login' });
            helpers_js_1.MetadataManager.clear();
            helpers_js_1.qa.suite('E-commerce\tLogin');
            await helpers_js_1.qa.step('Fill credentials', async (step) => {
                await step.step('Submit', async () => {
                    // nested
                });
            });
            reporter.onTestPass({
                title: 'AUTH-101 login',
                parent: 'Login Scenarios',
                duration: 50,
                errors: [],
                file: '/test/specs/login.spec.js',
            });
            await reporter.onRunnerEnd();
            await (0, hooks_js_1.afterRunHook)();
            const written = JSON.parse((0, node_fs_1.readFileSync)(out, 'utf8'));
            strict_1.default.equal(written.format, 'jest-json');
            strict_1.default.equal(written.projectKey, 'AUTH');
            const report = written.report;
            const assertion = report.testResults?.[0]?.assertionResults?.[0];
            strict_1.default.equal(assertion?.title, 'AUTH-101 login');
            const qaMeta = assertion?.meta?.qa;
            strict_1.default.equal(qaMeta?.framework, 'wdio');
            strict_1.default.equal(qaMeta?.steps?.length, 2);
            strict_1.default.deepEqual(qaMeta?.suite, [
                { title: 'E-commerce' },
                { title: 'Login' },
            ]);
        }
        finally {
            forge_commons_1.QAnalyzerReporter.resetInstance();
            hooks_js_1.hooksLifecycle.reset();
            results_buffer_js_1.ResultsBuffer.reset();
            (0, node_fs_1.rmSync)(dir, { recursive: true, force: true });
        }
    });
});
