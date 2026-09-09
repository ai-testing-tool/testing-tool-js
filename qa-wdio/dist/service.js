"use strict";
/**
 * WDIO service for AiTestingTool (FR123).
 *
 * Register: `services: [[QaWdioService, { disableWebdriverScreenshotsReporting: false }]]`
 *
 * On test failure, captures a still-image screenshot (no video) and uploads via
 * Forge when configured (FR133). Cucumber: `afterScenario` (FR135). Never fails the WDIO run.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.QaWdioService = void 0;
const forge_commons_1 = require("@ai-testing-tool/forge-commons");
const failure_screenshot_buffer_1 = require("./failure-screenshot-buffer");
function resolveTitle(test) {
    if (typeof test.fullTitle === 'function') {
        try {
            return test.fullTitle() || test.title || 'unknown';
        }
        catch {
            // fall through
        }
    }
    if (typeof test.fullTitle === 'string' && test.fullTitle) {
        return test.fullTitle;
    }
    return test.title || 'unknown';
}
function scenarioTitle(scenario) {
    return scenario.title || scenario.name || 'unknown';
}
function scenarioTagNames(scenario) {
    if (!Array.isArray(scenario.tags))
        return [];
    return scenario.tags
        .map((t) => (typeof t === 'string' ? t : t?.name || ''))
        .filter(Boolean);
}
function browserRef() {
    const g = globalThis;
    return g.browser;
}
async function captureFailureScreenshot(label, issueKeySources) {
    const browser = browserRef();
    if (!browser?.takeScreenshot)
        return;
    const b64 = await browser.takeScreenshot();
    if (!b64)
        return;
    const content = Buffer.from(b64, 'base64');
    const outcome = await (0, forge_commons_1.uploadAttachmentForQa)({
        fileName: 'screenshot.png',
        mimeType: 'image/png',
        content,
        issueKeySources,
    });
    failure_screenshot_buffer_1.FailureScreenshotBuffer.add(label, outcome.attachment);
}
class QaWdioService {
    disableScreenshots;
    constructor(options = {}) {
        this.disableScreenshots =
            options.disableWebdriverScreenshotsReporting ?? true;
    }
    before() {
        failure_screenshot_buffer_1.FailureScreenshotBuffer.clear();
    }
    beforeTest() {
        // no-op
    }
    async afterTest(test, _context, result) {
        if (this.disableScreenshots)
            return;
        if (result?.passed)
            return;
        const title = resolveTitle(test);
        try {
            await captureFailureScreenshot(test.title || title, [title, test.title]);
        }
        catch {
            // Never fail the WDIO run
        }
    }
    /**
     * Cucumber / Gherkin failure still-image (FR135 + FR133).
     * WDIO cucumber framework invokes this after each scenario.
     */
    async afterScenario(world, result, scenario) {
        if (this.disableScreenshots)
            return;
        const passed = result?.passed ?? world?.passed;
        if (passed)
            return;
        const title = scenarioTitle(scenario);
        const tags = scenarioTagNames(scenario);
        try {
            await captureFailureScreenshot(title, [title, ...tags]);
        }
        catch {
            // Never fail the WDIO run
        }
    }
    after() {
        // no-op
    }
}
exports.QaWdioService = QaWdioService;
