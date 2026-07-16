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
const report_builder_js_1 = require("../report-builder.js");
function fixtureScenario(overrides = {}) {
    return {
        featureName: 'User CRUD Operations',
        uri: 'features/api-crud.feature',
        title: 'Get all users',
        pickle: {
            id: 'p1',
            uri: 'features/api-crud.feature',
            name: 'Get all users',
            language: 'en',
            steps: [
                { id: 's1', text: 'I send a GET request to "/users"', astNodeIds: [] },
                { id: 's2', text: 'the response status should be 200', astNodeIds: [] },
            ],
            tags: [
                { name: '@AUTH-101', astNodeId: 't1' },
                { name: '@QaSuite=API\tUsers\tRead', astNodeId: 't2' },
                { name: '@QaFields={"layer":"api"}', astNodeId: 't3' },
            ],
            astNodeIds: [],
        },
        status: 'passed',
        durationMs: 120,
        failureMessages: [],
        steps: [
            {
                pickleStepId: 's1',
                text: 'I send a GET request to "/users"',
                status: 'PASSED',
                durationMs: 40,
            },
            {
                pickleStepId: 's2',
                text: 'the response status should be 200',
                status: 'PASSED',
                durationMs: 5,
            },
        ],
        attachments: [],
        ...overrides,
    };
}
(0, node_test_1.describe)('scenarioToAssertion', () => {
    (0, node_test_1.it)('maps scenario to assertion with Gherkin steps in meta.qa (FR49)', () => {
        const assertion = (0, report_builder_js_1.scenarioToAssertion)(fixtureScenario());
        strict_1.default.ok(assertion);
        strict_1.default.equal(assertion.title, 'AUTH-101 Get all users');
        strict_1.default.deepEqual(assertion.ancestorTitles, ['API', 'Users', 'Read']);
        const qa = assertion.meta?.qa;
        strict_1.default.equal(qa?.framework, 'cucumberjs');
        strict_1.default.equal(qa?.steps?.length, 2);
        strict_1.default.equal(qa?.steps?.[0]?.name, 'I send a GET request to "/users"');
    });
    (0, node_test_1.it)('returns null for @QaIgnore', () => {
        const assertion = (0, report_builder_js_1.scenarioToAssertion)(fixtureScenario({
            pickle: {
                ...fixtureScenario().pickle,
                tags: [{ name: '@QaIgnore', astNodeId: 'ign' }],
            },
        }));
        strict_1.default.equal(assertion, null);
    });
    (0, node_test_1.it)('includes this.attach metadata in meta.qa.attachments (FR58)', async () => {
        const assertion = await (0, report_builder_js_1.scenarioToAssertionAsync)(fixtureScenario({
            attachments: [
                {
                    body: Buffer.from('{"ok":true}').toString('base64'),
                    contentEncoding: 'BASE64',
                    mediaType: 'application/json',
                    fileName: 'body.json',
                    testCaseStartedId: 'started-1',
                },
            ],
        }));
        strict_1.default.ok(assertion);
        const qa = assertion.meta?.qa;
        strict_1.default.equal(qa?.attachments?.length, 1);
        strict_1.default.equal(qa?.attachments?.[0]?.file_name, 'body.json');
        strict_1.default.equal(qa?.attachments?.[0]?.mime_type, 'application/json');
        strict_1.default.ok(typeof qa?.attachments?.[0]?.size === 'number');
        // No attach URL/token in unit test → metadata only (no content_ref)
        strict_1.default.equal(qa?.attachments?.[0]?.content_ref, undefined);
    });
});
(0, node_test_1.describe)('FR41 jest-json (FR50)', () => {
    (0, node_test_1.it)('buildIngestPayload uses format jest-json', () => {
        const assertion = (0, report_builder_js_1.scenarioToAssertion)(fixtureScenario());
        strict_1.default.ok(assertion);
        const report = (0, report_builder_js_1.toJestJsonReport)([
            {
                name: 'features/api-crud.feature',
                assertions: [assertion],
            },
        ]);
        const payload = (0, forge_commons_1.buildIngestPayload)({
            projectKey: 'AUTH',
            report,
            format: 'jest-json',
            launchName: 'cucumber #1',
        });
        strict_1.default.equal(payload.format, 'jest-json');
        strict_1.default.equal(payload.report.numTotalTests, 1);
    });
    (0, node_test_1.it)('mode=file writes FR41 payload', async () => {
        const dir = (0, node_fs_1.mkdtempSync)((0, node_path_1.join)((0, node_os_1.tmpdir)(), 'qa-cucumberjs-'));
        const out = (0, node_path_1.join)(dir, 'qanalyzer-results.json');
        try {
            forge_commons_1.QAnalyzerReporter.resetInstance();
            const reporter = forge_commons_1.QAnalyzerReporter.getInstance({
                mode: forge_commons_1.ModeEnum.file,
                projectKey: 'AUTH',
                file: { path: out },
            });
            const assertion = (0, report_builder_js_1.scenarioToAssertion)(fixtureScenario());
            strict_1.default.ok(assertion);
            await reporter.publishReport((0, report_builder_js_1.toJestJsonReport)([
                { name: 'features/api-crud.feature', assertions: [assertion] },
            ]), { format: 'jest-json' });
            const written = JSON.parse((0, node_fs_1.readFileSync)(out, 'utf8'));
            strict_1.default.equal(written.format, 'jest-json');
            strict_1.default.equal(written.projectKey, 'AUTH');
        }
        finally {
            forge_commons_1.QAnalyzerReporter.resetInstance();
            (0, node_fs_1.rmSync)(dir, { recursive: true, force: true });
        }
    });
});
