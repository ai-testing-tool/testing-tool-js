"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_events_1 = require("node:events");
const node_test_1 = require("node:test");
const qa_javascript_commons_1 = require("qa-javascript-commons");
const metadata_js_1 = __importDefault(require("../metadata.js"));
const mocha_js_1 = require("../mocha.js");
const plugin_js_1 = __importDefault(require("../plugin.js"));
const reporter_js_1 = require("../reporter.js");
(0, node_test_1.describe)('qa-cypress scaffold', () => {
    (0, node_test_1.it)('loads reporter module and no-ops publish when mode=off', async () => {
        qa_javascript_commons_1.QAnalyzerReporter.resetInstance();
        const runner = new node_events_1.EventEmitter();
        // Mocha Runner shape: EventEmitter with constants used in constructor
        const reporter = new reporter_js_1.CypressQaReporter(runner, {
            reporterOptions: { mode: qa_javascript_commons_1.ModeEnum.off, projectKey: 'AUTH' },
        });
        strict_1.default.ok(reporter);
        runner.emit('test'); // Mocha EVENT_TEST_BEGIN
        runner.emit('end'); // Mocha EVENT_RUN_END
        // Allow async onRunEnd to settle
        await new Promise((r) => setImmediate(r));
        await new Promise((r) => setImmediate(r));
        const instance = qa_javascript_commons_1.QAnalyzerReporter.getInstance({ mode: qa_javascript_commons_1.ModeEnum.off });
        strict_1.default.equal(instance.getConfig().mode, qa_javascript_commons_1.ModeEnum.off);
    });
    (0, node_test_1.it)('plugin registration does not throw', () => {
        const events = [];
        const on = (event) => {
            events.push(event);
        };
        const config = { projectRoot: '/tmp' };
        const out = (0, plugin_js_1.default)(on, config);
        strict_1.default.equal(out, config);
        strict_1.default.ok(events.includes('before:run'));
        strict_1.default.ok(events.includes('after:run'));
        strict_1.default.ok(events.includes('after:screenshot'));
    });
    (0, node_test_1.it)('metadata registration does not throw and records tasks', () => {
        mocha_js_1.MetadataManager.clear();
        const tasks = {};
        const on = (_event, map) => {
            Object.assign(tasks, map);
        };
        (0, metadata_js_1.default)(on);
        strict_1.default.equal(typeof tasks.qaTitle, 'function');
        strict_1.default.equal(tasks.qaTitle?.('AUTH-101'), null);
        strict_1.default.deepEqual(mocha_js_1.MetadataManager.getEntries(), [
            { type: 'qa-title', body: 'AUTH-101' },
        ]);
    });
    (0, node_test_1.it)('qa.step rejects async callbacks (FR64)', () => {
        mocha_js_1.MetadataManager.clear();
        strict_1.default.throws(() => mocha_js_1.qa.step('bad', () => {
            return Promise.resolve();
        }), /synchronous callback/);
    });
    (0, node_test_1.it)('qa helpers record sync step metadata without Cypress', () => {
        mocha_js_1.MetadataManager.clear();
        mocha_js_1.qa.suite('Login');
        mocha_js_1.qa.step('open', () => {
            // sync only
        });
        const entries = mocha_js_1.MetadataManager.getEntries();
        strict_1.default.ok(entries.some((e) => e.type === 'qa-suite' && e.body === 'Login'));
        strict_1.default.ok(entries.some((e) => e.type === 'qa-step' && e.body === 'open'));
        strict_1.default.ok(entries.some((e) => e.type === 'qa-step-end' &&
            e.body.status === 'passed'));
    });
});
