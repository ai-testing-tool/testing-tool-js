"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlaywrightQaReporter = void 0;
const forge_commons_1 = require("@qanalyzer/forge-commons");
const enrich_screenshots_1 = require("./enrich-screenshots");
const metadata_from_result_1 = require("./metadata-from-result");
const report_builder_1 = require("./report-builder");
/**
 * Playwright reporter for QAnalyzer.
 *
 * Configure:
 *   reporter: [['list'], ['@qanalyzer/forge-playwright', { mode: 'off' }]]
 *
 * Collects each test → FR41 shape A; native `test.step` → `meta.qa.steps`.
 * On failure, still-image attachments are uploaded via Forge (FR119).
 */
class PlaywrightQaReporter {
    options;
    byFile = new Map();
    runStart = Date.now();
    pendingUploads = [];
    publishPromise = null;
    constructor(options = {}) {
        this.options = options ?? {};
    }
    onBegin(_config, _suite) {
        this.byFile.clear();
        this.pendingUploads.length = 0;
    }
    onStepBegin(_test, _result, _step) {
        // Steps are read from result.steps on onTestEnd (full tree available there)
    }
    onTestEnd(test, result) {
        try {
            const pathTitles = typeof test.titlePath === 'function' ? test.titlePath() : [test.title];
            const ancestorTitles = pathTitles.slice(0, -1);
            const title = test.title;
            const fullName = ancestorTitles.length > 0
                ? `${ancestorTitles.join(' ')} ${title}`
                : title;
            const wire = (0, metadata_from_result_1.buildQaMetaFromResult)({
                attachments: result.attachments,
                steps: result.steps,
            });
            const failureMessages = (result.errors ?? [])
                .map((e) => {
                if (typeof e === 'string')
                    return e;
                if (e && typeof e === 'object' && 'message' in e) {
                    return String(e.message ?? '');
                }
                return String(e);
            })
                .filter(Boolean);
            const assertion = {
                ancestorTitles,
                title,
                fullName,
                status: (0, report_builder_1.mapPlaywrightStatus)(result.status),
                duration: result.duration,
                failureMessages,
            };
            if (wire) {
                assertion.meta = { qa: wire };
            }
            const file = test.location?.file ??
                test.file ??
                'unknown';
            const list = this.byFile.get(file) ?? [];
            list.push(assertion);
            this.byFile.set(file, list);
            if (assertion.status === 'failed') {
                this.pendingUploads.push((0, enrich_screenshots_1.enrichAssertionWithFailureScreenshots)(assertion, result.attachments).catch(() => {
                    // Never fail the Playwright run
                }));
            }
        }
        catch {
            // Never fail the Playwright run
        }
    }
    async onEnd(_result) {
        if (this.publishPromise) {
            await this.publishPromise;
            return;
        }
        this.publishPromise = this.publish();
        await this.publishPromise;
    }
    async publish() {
        try {
            await Promise.all(this.pendingUploads);
            forge_commons_1.QAnalyzerReporter.resetInstance();
            const reporter = forge_commons_1.QAnalyzerReporter.getInstance({
                ...this.options,
                mode: this.options.mode ?? forge_commons_1.ModeEnum.off,
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
            if (specs.length === 0)
                return;
            const report = (0, report_builder_1.toJestJsonReport)(specs, this.runStart);
            await reporter.publishReport(report, {
                format: 'jest-json',
                launchName: this.options.launchName,
                projectKey: this.options.projectKey,
            });
        }
        catch {
            // Never fail the Playwright run because of reporter publish errors
        }
    }
}
exports.PlaywrightQaReporter = PlaywrightQaReporter;
exports.default = PlaywrightQaReporter;
