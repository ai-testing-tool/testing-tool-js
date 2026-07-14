"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const cucumber_tags_js_1 = require("../cucumber-tags.js");
const metadata_manager_js_1 = require("../metadata-manager.js");
const reporter_js_1 = require("../reporter.js");
const results_buffer_js_1 = require("../results-buffer.js");
function fakeSuite(partial) {
    return partial;
}
function fakeTest(partial) {
    return partial;
}
(0, node_test_1.describe)('cucumber tags (FR135)', () => {
    (0, node_test_1.it)('applies suite/title/tags and collects bare issue keys', () => {
        metadata_manager_js_1.MetadataManager.clear();
        const { issueKeys } = (0, cucumber_tags_js_1.applyCucumberTags)([
            { name: '@AUTH-101' },
            { name: '@suite=Checkout' },
            { name: '@title=Buy stuff' },
            { name: '@tags=smoke,e2e' },
        ]);
        strict_1.default.deepEqual(issueKeys, ['AUTH-101']);
        const entries = metadata_manager_js_1.MetadataManager.getEntries();
        strict_1.default.ok(entries.some((e) => e.type === 'qa-suite' && e.body === 'Checkout'));
        strict_1.default.ok(entries.some((e) => e.type === 'qa-title' && e.body === 'Buy stuff'));
        strict_1.default.ok(entries.some((e) => e.type === 'qa-fields' &&
            typeof e.body === 'object' &&
            e.body !== null &&
            e.body.tags === 'smoke,e2e'));
        metadata_manager_js_1.MetadataManager.clear();
    });
});
(0, node_test_1.describe)('QaWdioReporter useCucumber (FR135)', () => {
    (0, node_test_1.it)('records one assertion per scenario with gherkin steps', () => {
        results_buffer_js_1.ResultsBuffer.reset({ mode: 'off', projectKey: 'AUTH' });
        const reporter = new reporter_js_1.QaWdioReporter({
            useCucumber: true,
            mode: 'off',
            projectKey: 'AUTH',
        });
        reporter.onSuiteStart(fakeSuite({
            uid: 'feature-1',
            title: 'Login',
            type: 'feature',
            file: 'features/login.feature',
        }));
        reporter.onSuiteStart(fakeSuite({
            uid: 'scenario-1',
            title: 'User can login',
            type: 'scenario',
            file: 'features/login.feature',
            tags: [{ name: '@AUTH-101' }],
            tests: [],
            hooks: [],
        }));
        const step1 = fakeTest({ title: 'Given I open login', state: 'passed', errors: [] });
        reporter.onTestStart(step1);
        reporter.onTestPass(step1);
        const step2 = fakeTest({
            title: 'When I submit',
            state: 'failed',
            errors: [{ message: 'boom' }],
        });
        reporter.onTestStart(step2);
        reporter.onTestFail(step2);
        reporter.onSuiteEnd(fakeSuite({
            uid: 'scenario-1',
            title: 'User can login',
            type: 'scenario',
            file: 'features/login.feature',
            tests: [
                { title: 'Given I open login', state: 'passed' },
                { title: 'When I submit', state: 'failed', errors: [{ message: 'boom' }] },
            ],
            hooks: [],
        }));
        const specs = results_buffer_js_1.ResultsBuffer.takeSpecs();
        strict_1.default.equal(specs.length, 1);
        strict_1.default.equal(specs[0].assertions.length, 1);
        const a = specs[0].assertions[0];
        strict_1.default.equal(a.status, 'failed');
        strict_1.default.match(a.title, /AUTH-101/);
        strict_1.default.ok(a.meta?.qa?.steps);
        strict_1.default.equal(a.meta.qa.steps.length, 2);
        strict_1.default.equal(a.meta.qa.steps[0].stepType, 'gherkin');
        strict_1.default.equal(a.meta.qa.steps[1].status, 'failed');
        strict_1.default.ok((a.failureMessages ?? []).some((m) => m.includes('boom')));
    });
    (0, node_test_1.it)('mocha path unchanged when useCucumber is false', () => {
        results_buffer_js_1.ResultsBuffer.reset({ mode: 'off', projectKey: 'AUTH' });
        const reporter = new reporter_js_1.QaWdioReporter({
            useCucumber: false,
            mode: 'off',
            projectKey: 'AUTH',
        });
        reporter.onSuiteStart(fakeSuite({
            uid: 'suite-1',
            title: 'Login',
            type: 'suite',
            file: 'test/login.spec.js',
        }));
        const test = fakeTest({
            title: 'AUTH-9 passes',
            state: 'passed',
            duration: 10,
            errors: [],
            parent: 'Login',
        });
        reporter.onTestStart(test);
        reporter.onTestPass(test);
        const specs = results_buffer_js_1.ResultsBuffer.takeSpecs();
        strict_1.default.equal(specs[0].assertions.length, 1);
        strict_1.default.equal(specs[0].assertions[0].title, 'AUTH-9 passes');
        strict_1.default.equal(specs[0].assertions[0].status, 'passed');
    });
});
