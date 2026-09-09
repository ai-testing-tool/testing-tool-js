"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScreenshotsManager = void 0;
exports.isStillImagePath = isStillImagePath;
exports.matchScreenshotToAssertion = matchScreenshotToAssertion;
exports.nextUnusedSpecScreenshot = nextUnusedSpecScreenshot;
/**
 * Bridge for Cypress `after:screenshot` details → plugin `after:run` upload (FR71).
 */
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const node_os_1 = require("node:os");
const DEFAULT_BASENAME = 'qa-cypress-screenshots.json';
function defaultPath() {
    if (process.env.AI_TESTING_TOOL_CYPRESS_SCREENSHOTS_PATH) {
        return process.env.AI_TESTING_TOOL_CYPRESS_SCREENSHOTS_PATH;
    }
    const results = process.env.AI_TESTING_TOOL_CYPRESS_RESULTS_PATH;
    if (results) {
        return results.replace(/\.json$/i, '') + '-screenshots.json';
    }
    return (0, node_path_1.join)((0, node_os_1.tmpdir)(), DEFAULT_BASENAME);
}
class ScreenshotsManager {
    static resolvePath(explicit) {
        return explicit ?? defaultPath();
    }
    static clear(path = ScreenshotsManager.resolvePath()) {
        if ((0, node_fs_1.existsSync)(path)) {
            try {
                (0, node_fs_1.unlinkSync)(path);
            }
            catch {
                // ignore
            }
        }
    }
    static getAll(path = ScreenshotsManager.resolvePath()) {
        if (!(0, node_fs_1.existsSync)(path))
            return [];
        try {
            const raw = JSON.parse((0, node_fs_1.readFileSync)(path, 'utf8'));
            return Array.isArray(raw.screenshots) ? raw.screenshots : [];
        }
        catch {
            return [];
        }
    }
    static append(record, path = ScreenshotsManager.resolvePath()) {
        if (!record.path)
            return;
        const screenshots = ScreenshotsManager.getAll(path);
        screenshots.push(record);
        try {
            (0, node_fs_1.mkdirSync)((0, node_path_1.dirname)(path), { recursive: true });
            (0, node_fs_1.writeFileSync)(path, JSON.stringify({ screenshots }, null, 0), 'utf8');
        }
        catch {
            // Never fail the Cypress run
        }
    }
}
exports.ScreenshotsManager = ScreenshotsManager;
/** True for still images; videos are skipped (Phase 3 still-image only). */
function isStillImagePath(filePath) {
    return /\.(png|jpe?g|webp|bmp)$/i.test(filePath);
}
function belongsToSpec(shot, specName) {
    if (!shot.specName) {
        // Path often contains the relative spec path
        const hay = shot.path.replace(/\\/g, '/').toLowerCase();
        const want = specName.replace(/\\/g, '/').toLowerCase();
        const base = want.split('/').pop() ?? want;
        return Boolean(base && hay.includes(base));
    }
    const normSpec = shot.specName.replace(/\\/g, '/').toLowerCase();
    const normName = specName.replace(/\\/g, '/').toLowerCase();
    return (normName.endsWith(normSpec) ||
        normSpec.endsWith(normName) ||
        normName.includes(normSpec) ||
        normSpec.includes(normName.split('/').pop() ?? ''));
}
/**
 * Match a failure screenshot to a failed assertion by title / fullName.
 */
function matchScreenshotToAssertion(shot, assertion, specName) {
    if (assertion.status !== 'failed')
        return false;
    if (shot.testFailure === false)
        return false;
    if (!isStillImagePath(shot.path))
        return false;
    if (!belongsToSpec(shot, specName))
        return false;
    const haystack = `${shot.path} ${shot.name ?? ''}`.toLowerCase();
    const title = assertion.title.toLowerCase();
    if (title && haystack.includes(title))
        return true;
    const full = (assertion.fullName ?? '').toLowerCase();
    if (full && haystack.includes(full))
        return true;
    return false;
}
/** Next unused failure still-image for this spec (ordered fallback). */
function nextUnusedSpecScreenshot(shots, used, specName) {
    return shots.findIndex((s, i) => !used.has(i) &&
        s.testFailure !== false &&
        isStillImagePath(s.path) &&
        belongsToSpec(s, specName));
}
