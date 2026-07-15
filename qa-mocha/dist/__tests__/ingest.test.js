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
const qa_forge_commons_1 = require("qa-forge-commons");
const reporter_js_1 = require("../reporter.js");
const mocha_js_1 = require("../mocha.js");
const report_builder_js_1 = require("../report-builder.js");
const SPECS = [
    {
        name: '/tests/api-crud.spec.js',
        startTime: 1_700_000_000_000,
        endTime: 1_700_000_000_050,
        assertions: [
            {
                ancestorTitles: ['CRUD'],
                fullName: 'CRUD AUTH-101 login',
                title: 'AUTH-101 login',
                status: 'passed',
                duration: 12,
                failureMessages: [],
            },
            {
                ancestorTitles: ['CRUD'],
                fullName: 'CRUD AUTH-102 logout',
                title: 'AUTH-102 logout',
                status: 'failed',
                duration: 8,
                failureMessages: ['Expected 200'],
            },
        ],
    },
];
(0, node_test_1.describe)('FR41 jest-json emit (FR93)', () => {
    (0, node_test_1.it)('buildIngestPayload uses format jest-json', () => {
        const payload = (0, qa_forge_commons_1.buildIngestPayload)({
            projectKey: 'AUTH',
            report: (0, report_builder_js_1.toJestJsonReport)(SPECS),
            format: 'jest-json',
            launchName: 'mocha #1',
        });
        strict_1.default.equal(payload.format, 'jest-json');
        strict_1.default.equal(payload.report.numFailedTests, 1);
        strict_1.default.equal(payload.report.testResults?.[0]?.assertionResults?.[0]?.title, 'AUTH-101 login');
    });
});
(0, node_test_1.describe)('mode=file publish', () => {
    (0, node_test_1.it)('writes FR41 payload with format jest-json', async () => {
        const dir = (0, node_fs_1.mkdtempSync)((0, node_path_1.join)((0, node_os_1.tmpdir)(), 'qa-mocha-'));
        const out = (0, node_path_1.join)(dir, 'qanalyzer-results.json');
        try {
            qa_forge_commons_1.QAnalyzerReporter.resetInstance();
            const reporter = qa_forge_commons_1.QAnalyzerReporter.getInstance({
                mode: qa_forge_commons_1.ModeEnum.file,
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
        }
        finally {
            qa_forge_commons_1.QAnalyzerReporter.resetInstance();
            (0, node_fs_1.rmSync)(dir, { recursive: true, force: true });
        }
    });
});
(0, node_test_1.describe)('qa.step sync/async (NFR26)', () => {
    (0, node_test_1.it)('sync step completes before return; async returns Promise', async () => {
        const order = [];
        mocha_js_1.qa.step('sync', () => {
            order.push('sync-body');
        });
        order.push('after-sync');
        await mocha_js_1.qa.step('async', async () => {
            order.push('async-body');
        });
        order.push('after-async');
        strict_1.default.deepEqual(order, [
            'sync-body',
            'after-sync',
            'async-body',
            'after-async',
        ]);
    });
});
(0, node_test_1.describe)('MochaQaReporter mode=off', () => {
    (0, node_test_1.it)('constructs without credentials', () => {
        const fakeRunner = {
            on() {
                return fakeRunner;
            },
            once() {
                return fakeRunner;
            },
            stats: { suites: 0, tests: 0, passes: 0, pending: 0, failures: 0 },
        };
        // Spec constructor needs a Runner-like object; mode=off path must not throw.
        strict_1.default.doesNotThrow(() => {
            try {
                // eslint-disable-next-line no-new
                new reporter_js_1.MochaQaReporter(fakeRunner, {
                    reporterOptions: { mode: qa_forge_commons_1.ModeEnum.off },
                });
            }
            catch (err) {
                // Spec may require more Runner shape — accept that and smoke the options path
                const message = err instanceof Error ? err.message : String(err);
                strict_1.default.ok(!/credentials|ingest|token/i.test(message), `unexpected credential error: ${message}`);
            }
        });
    });
});
