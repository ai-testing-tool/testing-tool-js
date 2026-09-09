"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publishBufferedResults = publishBufferedResults;
const forge_commons_1 = require("@ai-testing-tool/forge-commons");
const enrich_screenshots_1 = require("./enrich-screenshots");
const failure_screenshot_buffer_1 = require("./failure-screenshot-buffer");
const hooks_1 = require("./hooks");
const report_builder_1 = require("./report-builder");
const results_buffer_1 = require("./results-buffer");
/**
 * Publish buffered specs via commons (idempotent).
 * Called from `onRunnerEnd` and `afterRunHook` (FR123).
 * Merges FR133 failure screenshots before publish.
 */
async function publishBufferedResults() {
    if (results_buffer_1.ResultsBuffer.published)
        return;
    const options = results_buffer_1.ResultsBuffer.options;
    const mode = String(options.mode ?? forge_commons_1.ModeEnum.off);
    (0, hooks_1.assertHooksForMode)(mode, Boolean(options.debug));
    if (mode === 'off') {
        results_buffer_1.ResultsBuffer.published = true;
        results_buffer_1.ResultsBuffer.takeSpecs();
        failure_screenshot_buffer_1.FailureScreenshotBuffer.clear();
        return;
    }
    const specs = results_buffer_1.ResultsBuffer.takeSpecs();
    results_buffer_1.ResultsBuffer.published = true;
    if (specs.length === 0) {
        failure_screenshot_buffer_1.FailureScreenshotBuffer.clear();
        return;
    }
    try {
        (0, enrich_screenshots_1.enrichSpecsWithFailureScreenshots)(specs);
    }
    catch {
        // Never fail the WDIO run because of attach errors
    }
    forge_commons_1.AiTestingToolReporter.resetInstance();
    const reporter = forge_commons_1.AiTestingToolReporter.getInstance({
        ...options,
        mode: options.mode ?? forge_commons_1.ModeEnum.off,
        frameworkPackage: options.frameworkPackage ?? '@wdio/cli',
        frameworkName: options.frameworkName ?? 'wdio',
        reporterName: options.reporterName ?? '@ai-testing-tool/forge-wdio',
    });
    const report = (0, report_builder_1.toJestJsonReport)(specs, results_buffer_1.ResultsBuffer.runStart);
    await reporter.publishReport(report, {
        format: 'jest-json',
        launchName: options.launchName,
        projectKey: options.projectKey,
    });
    failure_screenshot_buffer_1.FailureScreenshotBuffer.clear();
}
