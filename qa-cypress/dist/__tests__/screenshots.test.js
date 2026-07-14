"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_fs_1 = require("node:fs");
const node_os_1 = require("node:os");
const node_path_1 = require("node:path");
const node_test_1 = require("node:test");
const enrich_screenshots_js_1 = require("../enrich-screenshots.js");
const screenshots_manager_js_1 = require("../screenshots-manager.js");
(0, node_test_1.describe)('Cypress failure screenshot enrich (FR71)', () => {
    (0, node_test_1.it)('attaches metadata for failed assertion when screenshot path exists', async () => {
        const dir = (0, node_fs_1.mkdtempSync)((0, node_path_1.join)((0, node_os_1.tmpdir)(), 'qa-cy-shot-'));
        const shotPath = (0, node_path_1.join)(dir, 'Login -- AUTH-102 logout (failed).png');
        const bridge = (0, node_path_1.join)(dir, 'shots.json');
        (0, node_fs_1.writeFileSync)(shotPath, Buffer.alloc(64, 1));
        try {
            screenshots_manager_js_1.ScreenshotsManager.clear(bridge);
            screenshots_manager_js_1.ScreenshotsManager.append({
                path: shotPath,
                name: 'AUTH-102 logout',
                specName: 'cypress/e2e/login.cy.js',
                testFailure: true,
            }, bridge);
            const specs = [
                {
                    name: 'cypress/e2e/login.cy.js',
                    assertions: [
                        {
                            ancestorTitles: ['Login'],
                            title: 'AUTH-102 logout',
                            fullName: 'Login AUTH-102 logout',
                            status: 'failed',
                            failureMessages: ['boom'],
                        },
                    ],
                },
            ];
            await (0, enrich_screenshots_js_1.enrichSpecsWithFailureScreenshots)(specs, bridge);
            const att = specs[0].assertions[0].meta?.qa?.attachments?.[0];
            strict_1.default.ok(att);
            strict_1.default.equal(att.file_name, 'Login -- AUTH-102 logout (failed).png');
            strict_1.default.equal(att.mime_type, 'image/png');
            strict_1.default.equal(att.size, 64);
            // No attach URL → metadata only
            strict_1.default.equal(att.content_ref, undefined);
        }
        finally {
            screenshots_manager_js_1.ScreenshotsManager.clear(bridge);
            (0, node_fs_1.rmSync)(dir, { recursive: true, force: true });
        }
    });
    (0, node_test_1.it)('skips video paths', async () => {
        const dir = (0, node_fs_1.mkdtempSync)((0, node_path_1.join)((0, node_os_1.tmpdir)(), 'qa-cy-vid-'));
        const video = (0, node_path_1.join)(dir, 'spec.mp4');
        const bridge = (0, node_path_1.join)(dir, 'shots.json');
        (0, node_fs_1.writeFileSync)(video, Buffer.alloc(32, 1));
        try {
            screenshots_manager_js_1.ScreenshotsManager.append({
                path: video,
                specName: 'spec.cy.js',
                testFailure: true,
            }, bridge);
            const specs = [
                {
                    name: 'spec.cy.js',
                    assertions: [
                        {
                            ancestorTitles: [],
                            title: 'AUTH-1 fail',
                            status: 'failed',
                        },
                    ],
                },
            ];
            await (0, enrich_screenshots_js_1.enrichSpecsWithFailureScreenshots)(specs, bridge);
            strict_1.default.equal(specs[0].assertions[0].meta?.qa?.attachments?.length ?? 0, 0);
        }
        finally {
            screenshots_manager_js_1.ScreenshotsManager.clear(bridge);
            (0, node_fs_1.rmSync)(dir, { recursive: true, force: true });
        }
    });
});
