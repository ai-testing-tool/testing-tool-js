"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeReportFilePath = normalizeReportFilePath;
const node_path_1 = require("node:path");
/**
 * Normalize a test file path for FR41 `testResults[].name`.
 * Absolute paths under `cwd` become project-relative (forward slashes).
 * Paths outside `cwd` (or already relative) are left as forward-slash form.
 */
function normalizeReportFilePath(filePath, cwd = process.cwd()) {
    const trimmed = filePath.trim();
    if (!trimmed)
        return trimmed;
    const forward = trimmed.replace(/\\/g, '/');
    if (!(0, node_path_1.isAbsolute)(trimmed)) {
        return forward.replace(/^\.\//, '');
    }
    const rel = (0, node_path_1.relative)(cwd, trimmed);
    if (!rel || rel.startsWith('..') || (0, node_path_1.isAbsolute)(rel)) {
        return forward;
    }
    return rel.replace(/\\/g, '/');
}
