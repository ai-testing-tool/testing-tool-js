"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CucumberQaFormatter = void 0;
const cucumber_1 = require("@cucumber/cucumber");
const qa_javascript_commons_1 = require("qa-javascript-commons");
const event_storage_1 = require("./modules/event-storage");
const report_builder_1 = require("./report-builder");
/**
 * CucumberJS custom formatter for QAnalyzer.
 *
 * Configure (`cucumber.js`):
 *   format: ['progress', 'qa-cucumberjs']
 *
 * Modes via env (`QANALYZER_MODE`) or formatOptions.
 * Helpers are tag-based (`@QaTitle`, `@QaSuite`, `@QaIgnore`, `@AUTH-101`) — no programmatic import (FR54).
 * `this.attach()` → envelope.attachment → optional Forge upload (FR58).
 */
class CucumberQaFormatter extends cucumber_1.Formatter {
    options;
    storage = new event_storage_1.EventStorage();
    byUri = new Map();
    runStart = Date.now();
    pendingScenarios = [];
    publishPromise = null;
    constructor(options) {
        const { mode, projectKey, debug, launchName, frameworkPackage, frameworkName, reporterName, fallback, file, ...formatterOptions } = options;
        super(formatterOptions);
        this.options = {
            mode,
            projectKey,
            debug,
            launchName,
            file,
            frameworkPackage: frameworkPackage ?? '@cucumber/cucumber',
            frameworkName: frameworkName ?? 'cucumberjs',
            reporterName: reporterName ?? 'qa-cucumberjs',
            fallback,
        };
        options.eventBroadcaster.on('envelope', (envelope) => {
            this.onEnvelope(envelope);
        });
    }
    async waitForPublish() {
        if (this.publishPromise)
            await this.publishPromise;
    }
    onEnvelope(envelope) {
        try {
            if (envelope.testCaseFinished) {
                const converted = this.storage.convertFinished(envelope.testCaseFinished);
                if (converted) {
                    this.pendingScenarios.push((0, report_builder_1.scenarioToAssertionAsync)(converted)
                        .then((assertion) => {
                        if (!assertion)
                            return;
                        const list = this.byUri.get(converted.uri) ?? [];
                        list.push(assertion);
                        this.byUri.set(converted.uri, list);
                    })
                        .catch(() => {
                        // Never fail the Cucumber run
                    }));
                }
            }
            else {
                this.storage.ingest(envelope);
            }
            if (envelope.testRunFinished) {
                this.publishPromise = this.publish();
                void this.publishPromise.catch(() => {
                    // Never fail the Cucumber run
                });
            }
        }
        catch {
            // Never fail the Cucumber run
        }
    }
    async publish() {
        try {
            await Promise.all(this.pendingScenarios);
            qa_javascript_commons_1.QAnalyzerReporter.resetInstance();
            const reporter = qa_javascript_commons_1.QAnalyzerReporter.getInstance({
                ...this.options,
                mode: this.options.mode ?? qa_javascript_commons_1.ModeEnum.off,
            });
            const mode = reporter.getConfig().mode ?? qa_javascript_commons_1.ModeEnum.off;
            if (mode === qa_javascript_commons_1.ModeEnum.off) {
                this.byUri.clear();
                return;
            }
            const specs = (0, report_builder_1.specsFromAssertions)(this.byUri, this.runStart, Date.now());
            this.byUri.clear();
            const report = (0, report_builder_1.toJestJsonReport)(specs, this.runStart);
            await reporter.publishReport(report, {
                format: 'jest-json',
                launchName: this.options.launchName,
                projectKey: this.options.projectKey,
            });
        }
        catch {
            // Never fail the Cucumber run
        }
    }
}
exports.CucumberQaFormatter = CucumberQaFormatter;
