"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MochaQaReporter = void 0;
const mocha_1 = require("mocha");
const forge_commons_1 = require("@ai-testing-tool/forge-commons");
const report_builder_1 = require("./report-builder");
function mapStatus(state) {
    if (state === 'failed')
        return 'failed';
    if (state === 'pending')
        return 'pending';
    return 'passed';
}
function ancestorTitles(test) {
    try {
        const path = typeof test.titlePath === 'function' ? test.titlePath() : [];
        if (path.length > 1)
            return path.slice(0, -1);
    }
    catch {
        // fall through
    }
    const titles = [];
    let parent = test.parent;
    while (parent && !parent.root) {
        if (parent.title)
            titles.unshift(parent.title);
        parent = parent.parent;
    }
    return titles;
}
function specFileName(test) {
    const fromTest = test.file;
    if (fromTest)
        return fromTest;
    let parent = test.parent;
    while (parent) {
        const file = parent.file;
        if (file)
            return file;
        parent = parent.parent;
    }
    return 'unknown';
}
function failureMessages(test) {
    const err = test.err;
    if (!err)
        return [];
    const msg = err.stack || err.message;
    return msg ? [msg] : [];
}
/**
 * Mocha custom reporter for AiTestingTool.
 *
 * Configure: `.mocharc.js` → `reporter: '@ai-testing-tool/forge-mocha'`
 * Options: `reporterOptions: { mode: 'ingest' | 'file' | 'off', … }`
 * Env: `AI_TESTING_TOOL_MODE`, `AI_TESTING_TOOL_PROJECT_KEY`, …
 *
 * Helpers from `@ai-testing-tool/forge-mocha/mocha` forward metadata via a global bridge.
 */
class MochaQaReporter extends mocha_1.reporters.Spec {
    options;
    bridgeBuffer = [];
    byFile = new Map();
    runStart = Date.now();
    publishPromise = null;
    constructor(runner, options = {}) {
        super(runner, options);
        this.options = options.reporterOptions ?? {};
        this.installBridge();
        runner.on(mocha_1.Runner.constants.EVENT_TEST_BEGIN, (test) => {
            this.bridgeBuffer.length = 0;
            if (globalThis.__QA_MOCHA_BRIDGE__) {
                globalThis.__QA_MOCHA_BRIDGE__.currentTitle = test.fullTitle?.() ?? test.title;
            }
        });
        runner.on(mocha_1.Runner.constants.EVENT_TEST_PASS, (test) => {
            this.record(test, 'passed');
        });
        runner.on(mocha_1.Runner.constants.EVENT_TEST_FAIL, (test) => {
            this.record(test, 'failed');
        });
        runner.on(mocha_1.Runner.constants.EVENT_TEST_PENDING, (test) => {
            this.record(test, 'pending');
        });
        runner.once(mocha_1.Runner.constants.EVENT_RUN_END, () => {
            this.publishPromise = this.publish();
            void this.publishPromise.catch(() => {
                // Never fail the Mocha run because of reporter publish errors
            });
        });
    }
    /** Await in-process publish (tests / programmatic runs). */
    async waitForPublish() {
        if (this.publishPromise)
            await this.publishPromise;
    }
    installBridge() {
        const bridge = {
            push: (entry) => {
                this.bridgeBuffer.push(entry);
            },
            drain: () => {
                const copy = [...this.bridgeBuffer];
                this.bridgeBuffer.length = 0;
                return copy;
            },
            currentTitle: undefined,
        };
        globalThis.__QA_MOCHA_BRIDGE__ = bridge;
    }
    record(test, state) {
        try {
            const entries = this.bridgeBuffer.splice(0, this.bridgeBuffer.length);
            const wire = (0, forge_commons_1.qaMetaFromEntries)(entries, {
                framework: 'mocha',
                reporter: '@ai-testing-tool/forge-mocha',
            });
            const ancestors = ancestorTitles(test);
            const assertion = {
                ancestorTitles: ancestors,
                title: test.title,
                fullName: ancestors.length > 0 ? `${ancestors.join(' ')} ${test.title}` : test.title,
                status: mapStatus(state ?? test.state),
                duration: test.duration ?? undefined,
                failureMessages: state === 'failed' ? failureMessages(test) : [],
            };
            if (wire) {
                assertion.meta = { qa: wire };
            }
            const file = specFileName(test);
            const list = this.byFile.get(file) ?? [];
            list.push(assertion);
            this.byFile.set(file, list);
        }
        catch {
            // Never fail the Mocha run
        }
    }
    async publish() {
        try {
            forge_commons_1.AiTestingToolReporter.resetInstance();
            const reporter = forge_commons_1.AiTestingToolReporter.getInstance({
                ...this.options,
                mode: this.options.mode ?? forge_commons_1.ModeEnum.off,
                frameworkName: this.options.frameworkName ?? 'mocha',
                reporterName: this.options.reporterName ?? '@ai-testing-tool/forge-mocha',
                frameworkPackage: this.options.frameworkPackage ?? 'mocha',
            });
            const mode = reporter.getConfig().mode ?? forge_commons_1.ModeEnum.off;
            if (mode === forge_commons_1.ModeEnum.off) {
                this.byFile.clear();
                return;
            }
            const specs = [];
            for (const [name, assertions] of this.byFile) {
                if (assertions.length === 0)
                    continue;
                specs.push({
                    name,
                    startTime: this.runStart,
                    endTime: Date.now(),
                    assertions,
                });
            }
            this.byFile.clear();
            const report = (0, report_builder_1.toJestJsonReport)(specs, this.runStart);
            await reporter.publishReport(report, {
                format: 'jest-json',
                launchName: this.options.launchName,
                projectKey: this.options.projectKey,
            });
        }
        catch {
            // Never fail the Mocha run because of reporter publish errors
        }
    }
}
exports.MochaQaReporter = MochaQaReporter;
