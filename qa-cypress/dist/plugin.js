"use strict";
/**
 * Cypress Node plugin — register in cypress.config.js setupNodeEvents:
 *   require('@ai-testing-tool/forge-cypress/plugin')(on, config);
 *
 * before:run clears the results bridge; after:run publishes FR41
 * (mode=ingest | file) via @ai-testing-tool/forge-commons.
 * after:screenshot captures failure still images for Phase 3 upload (FR71).
 */
const forge_commons_1 = require("@ai-testing-tool/forge-commons");
const enrich_screenshots_1 = require("./enrich-screenshots");
const report_builder_1 = require("./report-builder");
const resolve_options_1 = require("./resolve-options");
const results_manager_1 = require("./results-manager");
const screenshots_manager_1 = require("./screenshots-manager");
async function publishCollected(options) {
    const path = results_manager_1.ResultsManager.resolvePath(options.resultsPath);
    const specs = results_manager_1.ResultsManager.getSpecs(path);
    if (specs.length === 0) {
        screenshots_manager_1.ScreenshotsManager.clear();
        return;
    }
    forge_commons_1.AiTestingToolReporter.resetInstance();
    const reporter = forge_commons_1.AiTestingToolReporter.getInstance({
        ...options,
        mode: options.mode ?? forge_commons_1.ModeEnum.off,
    });
    const mode = reporter.getConfig().mode ?? forge_commons_1.ModeEnum.off;
    if (mode === forge_commons_1.ModeEnum.off) {
        results_manager_1.ResultsManager.clear(path);
        screenshots_manager_1.ScreenshotsManager.clear();
        return;
    }
    try {
        await (0, enrich_screenshots_1.enrichSpecsWithFailureScreenshots)(specs);
    }
    catch {
        // Never fail the Cypress run because of attach errors
    }
    const report = (0, report_builder_1.toJestJsonReport)(specs, Date.now());
    await reporter.publishReport(report, {
        format: 'jest-json',
        launchName: options.launchName,
        projectKey: options.projectKey,
    });
    results_manager_1.ResultsManager.clear(path);
    screenshots_manager_1.ScreenshotsManager.clear();
}
function plugin(on, config) {
    const qaOptions = (0, resolve_options_1.resolveQaOptions)(config.reporterOptions);
    if (qaOptions.resultsPath) {
        process.env.AI_TESTING_TOOL_CYPRESS_RESULTS_PATH = qaOptions.resultsPath;
    }
    else if (config.projectRoot && !process.env.AI_TESTING_TOOL_CYPRESS_RESULTS_PATH) {
        process.env.AI_TESTING_TOOL_CYPRESS_RESULTS_PATH = `${config.projectRoot}/.qa-cypress-results.json`;
    }
    on('before:run', () => {
        results_manager_1.ResultsManager.clear(results_manager_1.ResultsManager.resolvePath(qaOptions.resultsPath));
        screenshots_manager_1.ScreenshotsManager.clear();
    });
    on('after:screenshot', (details) => {
        try {
            const d = details;
            if (!d?.path)
                return details;
            screenshots_manager_1.ScreenshotsManager.append({
                path: d.path,
                name: d.name,
                specName: d.specName,
                testFailure: d.testFailure,
                takenAt: d.takenAt,
            });
        }
        catch {
            // Never fail the Cypress run
        }
        return details;
    });
    on('after:run', async () => {
        try {
            await publishCollected((0, resolve_options_1.resolveQaOptions)(config.reporterOptions));
        }
        catch {
            // Never fail the Cypress run because of publish errors
        }
    });
    return config;
}
module.exports = plugin;
