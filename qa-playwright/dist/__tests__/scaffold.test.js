"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const forge_commons_1 = require("@qanalyzer/forge-commons");
const helpers_js_1 = require("../helpers.js");
const reporter_js_1 = require("../reporter.js");
const index_js_1 = __importDefault(require("../index.js"));
(0, node_test_1.describe)('@qanalyzer/forge-playwright scaffold', () => {
    (0, node_test_1.it)('loads reporter module and no-ops publish when mode=off', async () => {
        forge_commons_1.QAnalyzerReporter.resetInstance();
        const reporter = new reporter_js_1.PlaywrightQaReporter({
            mode: forge_commons_1.ModeEnum.off,
            projectKey: 'AUTH',
        });
        strict_1.default.ok(reporter);
        strict_1.default.equal(index_js_1.default, reporter_js_1.PlaywrightQaReporter);
        reporter.onBegin({}, {});
        reporter.onTestEnd({}, {});
        await reporter.onEnd({});
        const instance = forge_commons_1.QAnalyzerReporter.getInstance({ mode: forge_commons_1.ModeEnum.off });
        strict_1.default.equal(instance.getConfig().mode, forge_commons_1.ModeEnum.off);
    });
    (0, node_test_1.it)('qa helpers record metadata without Playwright context', () => {
        helpers_js_1.MetadataManager.clear();
        helpers_js_1.qa.suite('E-commerce\tLogin');
        helpers_js_1.qa.fields({ layer: 'e2e' });
        helpers_js_1.qa.parameters({ user: 'standard_user' });
        helpers_js_1.qa.comment('ok');
        helpers_js_1.qa.ignore();
        helpers_js_1.qa.attach({ name: 'note.txt', contentType: 'text/plain' });
        const entries = helpers_js_1.MetadataManager.getEntries();
        strict_1.default.ok(entries.some((e) => e.type === 'qa-suite' && e.body === 'E-commerce\tLogin'));
        strict_1.default.ok(entries.some((e) => e.type === 'qa-fields'));
        strict_1.default.ok(entries.some((e) => e.type === 'qa-parameters'));
        strict_1.default.ok(entries.some((e) => e.type === 'qa-comment' && e.body === 'ok'));
        strict_1.default.ok(entries.some((e) => e.type === 'qa-ignore'));
        strict_1.default.ok(entries.some((e) => e.type === 'qa-attach'));
    });
    (0, node_test_1.it)('does not export qa.step (FR112 — use native test.step)', () => {
        strict_1.default.equal('step' in helpers_js_1.qa, false, 'qa.step must not exist — use Playwright test.step()');
    });
});
