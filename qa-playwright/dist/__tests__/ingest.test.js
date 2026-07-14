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
const metadata_manager_js_1 = require("../metadata-manager.js");
const reporter_js_1 = require("../reporter.js");
const report_builder_js_1 = require("../report-builder.js");
(0, node_test_1.describe)('mode=file publish', () => {
    (0, node_test_1.it)('writes FR41 payload with format jest-json', async () => {
        const dir = (0, node_fs_1.mkdtempSync)((0, node_path_1.join)((0, node_os_1.tmpdir)(), 'qa-playwright-'));
        const out = (0, node_path_1.join)(dir, 'qanalyzer-results.json');
        try {
            qa_javascript_commons_1.QAnalyzerReporter.resetInstance();
            const reporter = qa_javascript_commons_1.QAnalyzerReporter.getInstance({
                mode: qa_javascript_commons_1.ModeEnum.file,
                projectKey: 'AUTH',
                launchName: 'local',
                file: { path: out },
            });
            const payload = await reporter.publishReport((0, report_builder_js_1.toJestJsonReport)([
                {
                    name: 'test/login.spec.js',
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
            strict_1.default.equal(written.report
                .testResults?.[0]?.assertionResults?.[0]?.title, 'AUTH-101 login');
        }
        finally {
            qa_javascript_commons_1.QAnalyzerReporter.resetInstance();
            (0, node_fs_1.rmSync)(dir, { recursive: true, force: true });
        }
    });
});
(0, node_test_1.describe)('PlaywrightQaReporter modes', () => {
    (0, node_test_1.it)('mode=off completes without credentials', async () => {
        const reporter = new reporter_js_1.PlaywrightQaReporter({ mode: qa_javascript_commons_1.ModeEnum.off });
        reporter.onBegin({}, {});
        reporter.onTestEnd({
            title: 'AUTH-101',
            titlePath: () => ['Login', 'AUTH-101'],
            location: { file: '/t.spec.js', line: 1, column: 1 },
        }, { status: 'passed', duration: 1, errors: [], steps: [], attachments: [] });
        await reporter.onEnd({});
    });
    (0, node_test_1.it)('mode=file via reporter writes payload with native steps', async () => {
        const dir = (0, node_fs_1.mkdtempSync)((0, node_path_1.join)((0, node_os_1.tmpdir)(), 'qa-pw-rep-'));
        const out = (0, node_path_1.join)(dir, 'out.json');
        try {
            const reporter = new reporter_js_1.PlaywrightQaReporter({
                mode: qa_javascript_commons_1.ModeEnum.file,
                projectKey: 'AUTH',
                file: { path: out },
            });
            reporter.onBegin({}, {});
            reporter.onTestEnd({
                title: 'AUTH-101 login',
                titlePath: () => ['Login Scenarios', 'AUTH-101 login'],
                location: { file: '/test/login.spec.js', line: 10, column: 1 },
            }, {
                status: 'passed',
                duration: 50,
                errors: [],
                steps: [
                    {
                        category: 'test.step',
                        title: 'Fill in username',
                        steps: [],
                    },
                    {
                        category: 'test.step',
                        title: 'Submit',
                        steps: [],
                    },
                ],
                attachments: [
                    {
                        name: 'qanalyzer-metadata.json',
                        contentType: metadata_manager_js_1.QA_METADATA_CONTENT_TYPE,
                        body: Buffer.from(JSON.stringify({ suite: 'E-commerce\tLogin' }), 'utf8'),
                    },
                ],
            });
            await reporter.onEnd({});
            const written = JSON.parse((0, node_fs_1.readFileSync)(out, 'utf8'));
            strict_1.default.equal(written.format, 'jest-json');
            strict_1.default.equal(written.projectKey, 'AUTH');
            const report = written.report;
            const assertion = report.testResults?.[0]?.assertionResults?.[0];
            strict_1.default.equal(assertion?.title, 'AUTH-101 login');
            const qa = assertion?.meta?.qa;
            strict_1.default.equal(qa?.framework, 'playwright');
            strict_1.default.equal(qa?.steps?.length, 2);
            strict_1.default.deepEqual(qa?.suite, [{ title: 'E-commerce' }, { title: 'Login' }]);
        }
        finally {
            qa_javascript_commons_1.QAnalyzerReporter.resetInstance();
            (0, node_fs_1.rmSync)(dir, { recursive: true, force: true });
        }
    });
});
