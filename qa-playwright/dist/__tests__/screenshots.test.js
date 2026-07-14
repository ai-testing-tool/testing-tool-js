"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const enrich_screenshots_js_1 = require("../enrich-screenshots.js");
(0, node_test_1.describe)('Playwright failure screenshot enrich (FR119)', () => {
    (0, node_test_1.it)('isStillImageAttachment accepts png and rejects video', () => {
        strict_1.default.equal((0, enrich_screenshots_js_1.isStillImageAttachment)({
            name: 'screenshot',
            contentType: 'image/png',
        }), true);
        strict_1.default.equal((0, enrich_screenshots_js_1.isStillImageAttachment)({
            name: 'video',
            contentType: 'video/webm',
        }), false);
    });
    (0, node_test_1.it)('uploads metadata for failed test png body (no attach URL → no content_ref)', async () => {
        const assertion = {
            ancestorTitles: ['Suite'],
            title: 'AUTH-101 fails',
            fullName: 'Suite AUTH-101 fails',
            status: 'failed',
            failureMessages: ['err'],
        };
        await (0, enrich_screenshots_js_1.enrichAssertionWithFailureScreenshots)(assertion, [
            {
                name: 'screenshot',
                contentType: 'image/png',
                body: Buffer.alloc(48, 2),
            },
            {
                name: 'video',
                contentType: 'video/webm',
                body: Buffer.alloc(48, 3),
            },
        ]);
        const atts = assertion.meta?.qa?.attachments ?? [];
        strict_1.default.equal(atts.length, 1);
        strict_1.default.equal(atts[0].file_name, 'screenshot');
        strict_1.default.equal(atts[0].mime_type, 'image/png');
        strict_1.default.equal(atts[0].size, 48);
        strict_1.default.equal(atts[0].content_ref, undefined);
    });
    (0, node_test_1.it)('skips uploads for passed tests', async () => {
        const assertion = {
            ancestorTitles: [],
            title: 'AUTH-101 ok',
            status: 'passed',
        };
        await (0, enrich_screenshots_js_1.enrichAssertionWithFailureScreenshots)(assertion, [
            { name: 'screenshot', contentType: 'image/png', body: Buffer.alloc(8) },
        ]);
        strict_1.default.equal(assertion.meta?.qa?.attachments, undefined);
    });
});
