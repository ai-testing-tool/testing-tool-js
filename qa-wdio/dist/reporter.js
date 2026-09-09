"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QaWdioReporter = void 0;
const reporter_1 = __importDefault(require("@wdio/reporter"));
const forge_commons_1 = require("@ai-testing-tool/forge-commons");
const cucumber_tags_1 = require("./cucumber-tags");
const metadata_manager_1 = require("./metadata-manager");
const publish_1 = require("./publish");
const report_builder_1 = require("./report-builder");
const results_buffer_1 = require("./results-buffer");
function ancestorTitles(test, suiteStack) {
    if (suiteStack.length > 0) {
        return suiteStack.map((s) => s.title).filter((t) => t && t !== '(root)');
    }
    if (test.parent && test.parent !== '(root)') {
        return [test.parent];
    }
    return [];
}
function failureMessages(test) {
    const errors = test.errors ?? [];
    return errors
        .map((e) => {
        if (!e)
            return '';
        if (typeof e === 'string')
            return e;
        const err = e;
        return err.stack || err.message || String(e);
    })
        .filter(Boolean);
}
function suiteTags(suite) {
    const tags = suite.tags;
    return Array.isArray(tags) ? tags : [];
}
/**
 * WebdriverIO reporter for AiTestingTool.
 *
 * Configure:
 *   reporters: [[QaWdioReporter, { disableWebdriverStepsReporting: true }]]
 *   // Cucumber:
 *   reporters: [[QaWdioReporter, { useCucumber: true }]]
 *
 * Mocha: each `it()` → FR41 assertion; `qa.step` → `meta.qa.steps`.
 * Cucumber: each scenario suite → FR41 assertion; Gherkin steps → `meta.qa.steps` (FR135).
 */
class QaWdioReporter extends reporter_1.default {
    qaOptions;
    disableWebdriverStepsReporting;
    disableWebdriverScreenshotsReporting;
    useCucumber;
    suiteStack = [];
    currentFile = 'unknown';
    scenario = null;
    constructor(options = {}) {
        const { disableWebdriverStepsReporting = true, disableWebdriverScreenshotsReporting = true, useCucumber = false, outputDir, mode, projectKey, debug, launchName, frameworkPackage, frameworkName, reporterName, fallback, file, ...rest } = options;
        super({
            stdout: true,
            writeStream: process.stdout,
            outputDir,
            ...rest,
        });
        this.disableWebdriverStepsReporting = disableWebdriverStepsReporting;
        this.disableWebdriverScreenshotsReporting =
            disableWebdriverScreenshotsReporting;
        this.useCucumber = useCucumber;
        this.qaOptions = {
            mode,
            projectKey,
            debug,
            launchName,
            file,
            frameworkPackage: frameworkPackage ?? '@wdio/cli',
            frameworkName: frameworkName ?? 'wdio',
            reporterName: reporterName ?? '@ai-testing-tool/forge-wdio',
            fallback,
        };
        results_buffer_1.ResultsBuffer.reset(this.qaOptions);
        forge_commons_1.AiTestingToolReporter.getInstance(this.qaOptions);
    }
    onSuiteStart(suite) {
        if (suite.file) {
            this.currentFile = suite.file;
        }
        if (this.useCucumber && suite.type === 'scenario') {
            metadata_manager_1.MetadataManager.clear();
            const tagResult = (0, cucumber_tags_1.applyCucumberTags)(suiteTags(suite));
            this.scenario = {
                title: suite.title,
                file: suite.file || this.currentFile || 'unknown',
                ancestors: this.suiteStack
                    .map((s) => s.title)
                    .filter((t) => t && t !== '(root)'),
                issueKeys: tagResult.issueKeys,
                steps: [],
            };
            return;
        }
        this.suiteStack.push({ uid: suite.uid, title: suite.title });
    }
    onSuiteEnd(suite) {
        if (this.useCucumber && suite.type === 'scenario') {
            this.finalizeCucumberScenario(suite);
            return;
        }
        const idx = [...this.suiteStack]
            .reverse()
            .findIndex((s) => s.uid === suite.uid);
        if (idx >= 0) {
            this.suiteStack.splice(this.suiteStack.length - 1 - idx, 1);
        }
        else if (this.suiteStack.length > 0) {
            this.suiteStack.pop();
        }
    }
    onTestStart(test) {
        if (this.useCucumber) {
            if (this.scenario) {
                this.scenario.currentStep = test.title;
                metadata_manager_1.MetadataManager.push('qa-step-start', test.title);
            }
            return;
        }
        metadata_manager_1.MetadataManager.clear();
    }
    onTestPass(test) {
        if (this.useCucumber) {
            this.endCucumberStep(test, 'passed');
            return;
        }
        this.record(test, 'passed');
    }
    onTestFail(test) {
        if (this.useCucumber) {
            this.endCucumberStep(test, 'failed');
            return;
        }
        this.record(test, 'failed');
    }
    onTestSkip(test) {
        if (this.useCucumber) {
            this.endCucumberStep(test, 'skipped');
            return;
        }
        this.record(test, 'pending');
    }
    onTestRetry(test) {
        if (this.useCucumber) {
            this.endCucumberStep(test, test.state === 'failed' ? 'failed' : 'passed');
            return;
        }
        this.record(test, (0, report_builder_1.mapWdioStatus)(test.state));
    }
    async onRunnerEnd() {
        try {
            await (0, publish_1.publishBufferedResults)();
        }
        catch {
            // Never fail the WDIO run because of reporter publish errors
        }
    }
    endCucumberStep(test, status) {
        if (!this.scenario)
            return;
        const name = test.title || this.scenario.currentStep || 'step';
        const messages = status === 'failed' ? failureMessages(test) : [];
        metadata_manager_1.MetadataManager.push('qa-step-end', {
            name,
            status: status === 'skipped' ? 'skipped' : status,
        });
        this.scenario.steps.push({
            name,
            status,
            failureMessages: messages,
        });
        this.scenario.currentStep = undefined;
    }
    finalizeCucumberScenario(suite) {
        const scenario = this.scenario;
        this.scenario = null;
        if (!scenario)
            return;
        try {
            const children = [
                ...(suite.tests ?? []),
                ...(suite.hooks ?? []),
            ];
            const stepStatuses = scenario.steps.map((s) => s.status);
            const allSkipped = stepStatuses.length > 0 &&
                stepStatuses.every((s) => s === 'skipped') &&
                (children.length === 0 ||
                    children.every((c) => (c.state ?? 'passed') === 'skipped' || c.state === 'passed'));
            let status = 'passed';
            if (scenario.steps.some((s) => s.status === 'failed') ||
                children.some((c) => c.state === 'failed')) {
                status = 'failed';
            }
            else if (allSkipped ||
                (scenario.steps.length === 0 &&
                    children.every((c) => (c.state ?? 'skipped') === 'skipped'))) {
                status = 'pending';
            }
            const failureMessages = scenario.steps
                .filter((s) => s.status === 'failed')
                .flatMap((s) => s.failureMessages);
            const entries = metadata_manager_1.MetadataManager.getEntries();
            let wire = (0, forge_commons_1.qaMetaFromEntries)(entries, {
                framework: 'wdio',
                reporter: '@ai-testing-tool/forge-wdio',
            });
            metadata_manager_1.MetadataManager.clear();
            if (scenario.issueKeys.length > 0) {
                wire = {
                    ...(wire ?? {}),
                    framework: 'wdio',
                    host: {
                        framework: 'wdio',
                        reporter: '@ai-testing-tool/forge-wdio',
                    },
                    issueKeys: [...scenario.issueKeys],
                };
            }
            // Prefer buffered Gherkin step outcomes (includes skipped)
            if (scenario.steps.length > 0) {
                const stepsWire = scenario.steps.map((s, index) => ({
                    id: `step-${index}`,
                    stepType: 'gherkin',
                    name: s.name,
                    status: (s.status === 'skipped'
                        ? 'skipped'
                        : s.status),
                }));
                wire = {
                    ...(wire ?? {}),
                    framework: 'wdio',
                    host: {
                        framework: 'wdio',
                        reporter: '@ai-testing-tool/forge-wdio',
                    },
                    steps: stepsWire,
                };
            }
            const title = scenario.title;
            const ancestors = scenario.ancestors;
            const assertion = {
                ancestorTitles: ancestors,
                title,
                fullName: ancestors.length > 0 ? `${ancestors.join(' ')} ${title}` : title,
                status,
                duration: undefined,
                failureMessages: status === 'failed' ? failureMessages : [],
            };
            if (wire) {
                assertion.meta = { qa: wire };
            }
            results_buffer_1.ResultsBuffer.appendAssertion(scenario.file, assertion);
        }
        catch {
            // Never fail the WDIO run
        }
    }
    record(test, state) {
        try {
            const entries = metadata_manager_1.MetadataManager.getEntries();
            const wire = (0, forge_commons_1.qaMetaFromEntries)(entries, {
                framework: 'wdio',
                reporter: '@ai-testing-tool/forge-wdio',
            });
            metadata_manager_1.MetadataManager.clear();
            const ancestors = ancestorTitles(test, this.suiteStack);
            const title = test.title;
            const assertion = {
                ancestorTitles: ancestors,
                title,
                fullName: ancestors.length > 0 ? `${ancestors.join(' ')} ${title}` : title,
                status: (0, report_builder_1.mapWdioStatus)(state),
                duration: test.duration,
                failureMessages: state === 'failed' ? failureMessages(test) : [],
            };
            if (wire) {
                assertion.meta = { qa: wire };
            }
            const file = test.file ??
                this.currentFile ??
                'unknown';
            results_buffer_1.ResultsBuffer.appendAssertion(file, assertion);
        }
        catch {
            // Never fail the WDIO run
        }
    }
}
exports.QaWdioReporter = QaWdioReporter;
exports.default = QaWdioReporter;
