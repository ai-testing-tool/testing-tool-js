"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const enrich_screenshots_js_1 = require("../enrich-screenshots.js");
const failure_screenshot_buffer_js_1 = require("../failure-screenshot-buffer.js");
const service_js_1 = require("../service.js");
(0, node_test_1.describe)('WDIO failure screenshot enrich (FR133)', () => {
    (0, node_test_1.it)('merges buffered screenshots onto failed assertions', () => {
        failure_screenshot_buffer_js_1.FailureScreenshotBuffer.clear();
        failure_screenshot_buffer_js_1.FailureScreenshotBuffer.add('AUTH-101 fails', {
            file_name: 'screenshot.png',
            mime_type: 'image/png',
            size: 12,
        });
        const specs = [
            {
                name: 'test/spec.js',
                assertions: [
                    {
                        ancestorTitles: [],
                        title: 'AUTH-101 fails',
                        status: 'failed',
                        failureMessages: ['x'],
                    },
                ],
            },
        ];
        (0, enrich_screenshots_js_1.enrichSpecsWithFailureScreenshots)(specs);
        const att = specs[0].assertions[0].meta?.qa?.attachments?.[0];
        strict_1.default.ok(att);
        strict_1.default.equal(att.file_name, 'screenshot.png');
        strict_1.default.equal(att.mime_type, 'image/png');
        strict_1.default.equal(failure_screenshot_buffer_js_1.FailureScreenshotBuffer.size(), 0);
    });
    (0, node_test_1.it)('service afterTest captures screenshot when enabled', async () => {
        failure_screenshot_buffer_js_1.FailureScreenshotBuffer.clear();
        const service = new service_js_1.QaWdioService({
            disableWebdriverScreenshotsReporting: false,
        });
        const g = globalThis;
        const prev = g.browser;
        g.browser = {
            takeScreenshot: async () => Buffer.from('png-bytes').toString('base64'),
        };
        try {
            await service.afterTest({ title: 'AUTH-202 fails' }, {}, { passed: false });
            strict_1.default.equal(failure_screenshot_buffer_js_1.FailureScreenshotBuffer.size(), 1);
            const shots = failure_screenshot_buffer_js_1.FailureScreenshotBuffer.takeForTitle('AUTH-202 fails');
            strict_1.default.equal(shots[0].file_name, 'screenshot.png');
            strict_1.default.equal(shots[0].mime_type, 'image/png');
            strict_1.default.equal(shots[0].content_ref, undefined);
        }
        finally {
            g.browser = prev;
            failure_screenshot_buffer_js_1.FailureScreenshotBuffer.clear();
        }
    });
    (0, node_test_1.it)('service afterScenario captures screenshot on cucumber failure', async () => {
        failure_screenshot_buffer_js_1.FailureScreenshotBuffer.clear();
        const service = new service_js_1.QaWdioService({
            disableWebdriverScreenshotsReporting: false,
        });
        const g = globalThis;
        const prev = g.browser;
        g.browser = {
            takeScreenshot: async () => Buffer.from('png-bytes').toString('base64'),
        };
        try {
            await service.afterScenario({ passed: false }, { passed: false }, { title: 'AUTH-303 scenario', tags: [{ name: '@AUTH-303' }] });
            strict_1.default.equal(failure_screenshot_buffer_js_1.FailureScreenshotBuffer.size(), 1);
            const shots = failure_screenshot_buffer_js_1.FailureScreenshotBuffer.takeForTitle('AUTH-303 scenario');
            strict_1.default.equal(shots[0].file_name, 'screenshot.png');
        }
        finally {
            g.browser = prev;
            failure_screenshot_buffer_js_1.FailureScreenshotBuffer.clear();
        }
    });
});
