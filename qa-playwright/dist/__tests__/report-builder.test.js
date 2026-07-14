"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const node_test_1 = require("node:test");
const metadata_manager_js_1 = require("../metadata-manager.js");
const metadata_from_result_js_1 = require("../metadata-from-result.js");
const report_builder_js_1 = require("../report-builder.js");
const step_extractor_js_1 = require("../step-extractor.js");
function loadSaucedemoFixture() {
    const raw = JSON.parse((0, node_fs_1.readFileSync)((0, node_path_1.join)(__dirname, '../__fixtures__/saucedemo-13.json'), 'utf8'));
    return raw.specs.map((spec) => ({
        name: spec.name,
        assertions: spec.assertions.map((a) => {
            const stepTree = (a.steps ?? []).map((name) => ({
                category: 'test.step',
                title: name,
                steps: [],
            }));
            const wire = (0, metadata_from_result_js_1.buildQaMetaFromResult)({
                steps: stepTree,
                attachments: a.ignore
                    ? [
                        {
                            name: 'qanalyzer-metadata.json',
                            contentType: metadata_manager_js_1.QA_METADATA_CONTENT_TYPE,
                            body: Buffer.from(JSON.stringify({ ignore: true }), 'utf8'),
                        },
                    ]
                    : undefined,
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
(0, node_test_1.describe)('extractNativeSteps (FR112)', () => {
    (0, node_test_1.it)('flattens test.step hierarchy and skips hooks', () => {
        const steps = (0, step_extractor_js_1.extractNativeSteps)([
            {
                category: 'hook',
                title: 'Before Hooks',
                steps: [{ category: 'pw:api', title: 'goto', steps: [] }],
            },
            {
                category: 'test.step',
                title: 'open login',
                steps: [
                    {
                        category: 'test.step',
                        title: 'type username',
                        steps: [],
                    },
                ],
            },
            {
                category: 'test.step',
                title: 'submit',
                error: { message: 'boom' },
                steps: [],
            },
        ]);
        strict_1.default.equal(steps.length, 3);
        strict_1.default.equal(steps[0]?.name, 'open login');
        strict_1.default.equal(steps[0]?.status, 'passed');
        strict_1.default.equal(steps[1]?.name, 'type username');
        strict_1.default.equal(steps[2]?.name, 'submit');
        strict_1.default.equal(steps[2]?.status, 'failed');
    });
});
(0, node_test_1.describe)('buildQaMetaFromResult', () => {
    (0, node_test_1.it)('merges helper metadata attachments with native steps', () => {
        const wire = (0, metadata_from_result_js_1.buildQaMetaFromResult)({
            attachments: [
                {
                    name: 'qanalyzer-metadata.json',
                    contentType: metadata_manager_js_1.QA_METADATA_CONTENT_TYPE,
                    body: Buffer.from(JSON.stringify({ suite: 'Auth\tLogin', fields: { layer: 'e2e' } }), 'utf8'),
                },
            ],
            steps: [
                { category: 'test.step', title: 'open form', steps: [] },
            ],
        });
        strict_1.default.ok(wire);
        strict_1.default.equal(wire.framework, 'playwright');
        strict_1.default.deepEqual(wire.suite, [{ title: 'Auth' }, { title: 'Login' }]);
        strict_1.default.deepEqual(wire.fields, { layer: 'e2e' });
        strict_1.default.equal(wire.steps?.length, 1);
        strict_1.default.equal(wire.steps?.[0]?.name, 'open form');
    });
});
(0, node_test_1.describe)('toJestJsonReport', () => {
    (0, node_test_1.it)('maps Playwright-like specs to FR41 shape A', () => {
        const report = (0, report_builder_js_1.toJestJsonReport)([
            {
                name: 'test/login.spec.js',
                assertions: [
                    {
                        ancestorTitles: ['Login'],
                        title: 'AUTH-101 login',
                        status: 'passed',
                        duration: 10,
                    },
                    {
                        ancestorTitles: ['Login'],
                        title: 'AUTH-102 fail',
                        status: 'failed',
                        duration: 5,
                        failureMessages: ['Timeout'],
                    },
                ],
            },
        ], 1_700_000_000_000);
        strict_1.default.equal(report.numTotalTests, 2);
        strict_1.default.equal(report.numPassedTests, 1);
        strict_1.default.equal(report.numFailedTests, 1);
        strict_1.default.equal(report.success, false);
    });
});
(0, node_test_1.describe)('saucedemo fixture (FR118)', () => {
    (0, node_test_1.it)('normalizes 13 reference tests with AUTH titles and steps', () => {
        const specs = loadSaucedemoFixture();
        const report = (0, report_builder_js_1.toJestJsonReport)(specs, 1_700_000_000_000);
        strict_1.default.equal(report.numTotalTestSuites, 4);
        strict_1.default.equal(report.numTotalTests, 13);
        strict_1.default.equal(report.numPassedTests, 12);
        strict_1.default.equal(report.numPendingTests, 1);
        strict_1.default.equal(report.success, true);
        const titles = [];
        for (const file of report.testResults ?? []) {
            for (const a of file.assertionResults ?? []) {
                titles.push(String(a.title));
            }
        }
        strict_1.default.equal(titles.length, 13);
        strict_1.default.ok(titles.every((t) => /^AUTH-\d+/.test(t)));
        const login = report.testResults?.find((f) => f.name?.includes('login'));
        const firstQa = login?.assertionResults?.[0]?.meta?.qa;
        strict_1.default.equal(firstQa?.framework, 'playwright');
        strict_1.default.ok(firstQa?.steps && firstQa.steps.length >= 3);
    });
});
