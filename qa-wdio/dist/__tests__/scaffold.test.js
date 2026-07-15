"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const qa_forge_commons_1 = require("qa-forge-commons");
const hooks_js_1 = require("../hooks.js");
const helpers_js_1 = require("../helpers.js");
const service_js_1 = require("../service.js");
const reporter_js_1 = require("../reporter.js");
const index_js_1 = __importDefault(require("../index.js"));
(0, node_test_1.describe)('qa-forge-wdio scaffold', () => {
    (0, node_test_1.it)('loads reporter module and no-ops when mode=off', async () => {
        qa_forge_commons_1.QAnalyzerReporter.resetInstance();
        hooks_js_1.hooksLifecycle.reset();
        await (0, hooks_js_1.beforeRunHook)({ mode: qa_forge_commons_1.ModeEnum.off, projectKey: 'AUTH' });
        const reporter = new reporter_js_1.QaWdioReporter({
            mode: qa_forge_commons_1.ModeEnum.off,
            projectKey: 'AUTH',
        });
        strict_1.default.ok(reporter);
        strict_1.default.equal(reporter.disableWebdriverStepsReporting, true);
        strict_1.default.equal(index_js_1.default, reporter_js_1.QaWdioReporter);
        reporter.onRunnerEnd();
        await (0, hooks_js_1.afterRunHook)();
        const instance = qa_forge_commons_1.QAnalyzerReporter.getInstance();
        strict_1.default.equal(instance.getConfig().mode, qa_forge_commons_1.ModeEnum.off);
        strict_1.default.equal(hooks_js_1.hooksLifecycle.beforeCalled, true);
        strict_1.default.equal(hooks_js_1.hooksLifecycle.afterCalled, true);
    });
    (0, node_test_1.it)('exports QaWdioService lifecycle hooks', async () => {
        const service = new service_js_1.QaWdioService({});
        service.before();
        service.beforeTest();
        await service.afterTest({ title: 't' }, {}, { passed: true });
        service.after();
        strict_1.default.ok(service);
    });
    (0, node_test_1.it)('qa helpers record metadata including nested steps and type attach', async () => {
        helpers_js_1.MetadataManager.clear();
        helpers_js_1.qa.suite('E-commerce\tLogin');
        helpers_js_1.qa.fields({ layer: 'e2e' });
        helpers_js_1.qa.parameters({ user: 'standard_user' });
        helpers_js_1.qa.comment('ok');
        helpers_js_1.qa.ignore();
        helpers_js_1.qa.attach({ name: 'note.txt', type: 'text/plain' });
        await helpers_js_1.qa.step('outer', async (step) => {
            await step.step('inner', async () => {
                // nested
            });
        });
        const entries = helpers_js_1.MetadataManager.getEntries();
        strict_1.default.ok(entries.some((e) => e.type === 'qa-suite'));
        strict_1.default.ok(entries.some((e) => e.type === 'qa-fields'));
        strict_1.default.ok(entries.some((e) => e.type === 'qa-parameters'));
        strict_1.default.ok(entries.some((e) => e.type === 'qa-comment'));
        strict_1.default.ok(entries.some((e) => e.type === 'qa-ignore'));
        strict_1.default.ok(entries.some((e) => e.type === 'qa-attach' &&
            e.body.type === 'text/plain'));
        strict_1.default.ok(entries.some((e) => e.type === 'qa-step-start' && e.body === 'outer'));
        strict_1.default.ok(entries.some((e) => e.type === 'qa-step-start' && e.body === 'inner'));
        strict_1.default.ok(entries.some((e) => e.type === 'qa-step-end' &&
            e.body.name === 'inner' &&
            e.body.status === 'passed'));
    });
    (0, node_test_1.it)('assertHooksForMode throws in debug when hooks missing (NFR33)', () => {
        hooks_js_1.hooksLifecycle.reset();
        strict_1.default.throws(() => (0, hooks_js_1.assertHooksForMode)(qa_forge_commons_1.ModeEnum.ingest, true), /beforeRunHook|afterRunHook|NFR33/);
    });
});
