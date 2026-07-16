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
const plugin_js_1 = __importDefault(require("../plugin.js"));
const report_builder_js_1 = require("../report-builder.js");
const resolve_options_js_1 = require("../resolve-options.js");
const results_manager_js_1 = require("../results-manager.js");
const SPECS = [
    {
        name: 'cypress/e2e/login.cy.js',
        assertions: [
            {
                ancestorTitles: ['Login Scenarios'],
                title: 'AUTH-101 login',
                status: 'passed',
                duration: 12,
                failureMessages: [],
            },
            {
                ancestorTitles: ['Login Scenarios'],
                title: 'AUTH-102 logout',
                status: 'failed',
                duration: 8,
                failureMessages: ['Expected 200'],
            },
        ],
    },
];
(0, node_test_1.describe)('resolveQaOptions', () => {
    (0, node_test_1.it)('unwraps cypress-multi-reporters qaCypressReporterOptions', () => {
        const opts = (0, resolve_options_js_1.resolveQaOptions)({
            reporterEnabled: '@qanalyzer/forge-cypress',
            qaCypressReporterOptions: { mode: 'file', projectKey: 'AUTH' },
        });
        strict_1.default.equal(opts.mode, 'file');
        strict_1.default.equal(opts.projectKey, 'AUTH');
    });
    (0, node_test_1.it)('accepts direct reporter options', () => {
        const opts = (0, resolve_options_js_1.resolveQaOptions)({ mode: 'ingest', projectKey: 'DEMO' });
        strict_1.default.equal(opts.mode, 'ingest');
        strict_1.default.equal(opts.projectKey, 'DEMO');
    });
});
(0, node_test_1.describe)('mode=file publish', () => {
    (0, node_test_1.it)('writes FR41 payload with format jest-json', async () => {
        const dir = (0, node_fs_1.mkdtempSync)((0, node_path_1.join)((0, node_os_1.tmpdir)(), 'qa-cypress-'));
        const out = (0, node_path_1.join)(dir, 'qanalyzer-results.json');
        try {
            forge_commons_1.QAnalyzerReporter.resetInstance();
            const reporter = forge_commons_1.QAnalyzerReporter.getInstance({
                mode: forge_commons_1.ModeEnum.file,
                projectKey: 'AUTH',
                launchName: 'local',
                file: { path: out },
            });
            const payload = await reporter.publishReport((0, report_builder_js_1.toJestJsonReport)(SPECS), {
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
            forge_commons_1.QAnalyzerReporter.resetInstance();
            (0, node_fs_1.rmSync)(dir, { recursive: true, force: true });
        }
    });
});
(0, node_test_1.describe)('ResultsManager + plugin after:run', () => {
    (0, node_test_1.it)('mode=file via plugin publishes buffered specs', async () => {
        const dir = (0, node_fs_1.mkdtempSync)((0, node_path_1.join)((0, node_os_1.tmpdir)(), 'qa-cypress-bridge-'));
        const bridge = (0, node_path_1.join)(dir, 'bridge.json');
        const out = (0, node_path_1.join)(dir, 'out.json');
        try {
            delete process.env.QANALYZER_CYPRESS_RESULTS_PATH;
            results_manager_js_1.ResultsManager.clear(bridge);
            results_manager_js_1.ResultsManager.appendSpec(SPECS[0], bridge);
            const handlers = new Map();
            const on = (event, handler) => {
                handlers.set(event, handler);
            };
            (0, plugin_js_1.default)(on, {
                projectRoot: dir,
                reporterOptions: {
                    qaCypressReporterOptions: {
                        mode: forge_commons_1.ModeEnum.file,
                        projectKey: 'AUTH',
                        resultsPath: bridge,
                        file: { path: out },
                    },
                },
            });
            const afterRun = handlers.get('after:run');
            strict_1.default.ok(afterRun);
            await afterRun();
            const written = JSON.parse((0, node_fs_1.readFileSync)(out, 'utf8'));
            strict_1.default.equal(written.format, 'jest-json');
            strict_1.default.equal(written.projectKey, 'AUTH');
            strict_1.default.equal(written.report.numTotalTests, 2);
            strict_1.default.equal(written.report.numFailedTests, 1);
        }
        finally {
            forge_commons_1.QAnalyzerReporter.resetInstance();
            delete process.env.QANALYZER_CYPRESS_RESULTS_PATH;
            (0, node_fs_1.rmSync)(dir, { recursive: true, force: true });
        }
    });
    (0, node_test_1.it)('mode=off after:run clears bridge without writing', async () => {
        const dir = (0, node_fs_1.mkdtempSync)((0, node_path_1.join)((0, node_os_1.tmpdir)(), 'qa-cypress-off-'));
        const bridge = (0, node_path_1.join)(dir, 'bridge.json');
        try {
            results_manager_js_1.ResultsManager.appendSpec(SPECS[0], bridge);
            strict_1.default.equal(results_manager_js_1.ResultsManager.getSpecs(bridge).length, 1);
            const handlers = new Map();
            const on = (event, handler) => {
                handlers.set(event, handler);
            };
            (0, plugin_js_1.default)(on, {
                reporterOptions: {
                    mode: forge_commons_1.ModeEnum.off,
                    projectKey: 'AUTH',
                    resultsPath: bridge,
                },
            });
            await handlers.get('after:run')?.();
            strict_1.default.equal(results_manager_js_1.ResultsManager.getSpecs(bridge).length, 0);
        }
        finally {
            forge_commons_1.QAnalyzerReporter.resetInstance();
            (0, node_fs_1.rmSync)(dir, { recursive: true, force: true });
        }
    });
});
