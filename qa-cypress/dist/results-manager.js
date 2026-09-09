"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResultsManager = void 0;
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const node_os_1 = require("node:os");
const DEFAULT_BASENAME = 'qa-cypress-results.json';
/**
 * File bridge across Cypress specs (reporter may run once per spec).
 * Plugin `before:run` clears; reporter appends; `after:run` reads + publishes.
 */
class ResultsManager {
    static resolvePath(explicit) {
        if (explicit)
            return explicit;
        if (process.env.AI_TESTING_TOOL_CYPRESS_RESULTS_PATH) {
            return process.env.AI_TESTING_TOOL_CYPRESS_RESULTS_PATH;
        }
        return (0, node_path_1.join)((0, node_os_1.tmpdir)(), DEFAULT_BASENAME);
    }
    static clear(path = ResultsManager.resolvePath()) {
        if ((0, node_fs_1.existsSync)(path)) {
            try {
                (0, node_fs_1.unlinkSync)(path);
            }
            catch {
                // ignore
            }
        }
    }
    static getSpecs(path = ResultsManager.resolvePath()) {
        if (!(0, node_fs_1.existsSync)(path))
            return [];
        try {
            const raw = JSON.parse((0, node_fs_1.readFileSync)(path, 'utf8'));
            return Array.isArray(raw.specs) ? raw.specs : [];
        }
        catch {
            return [];
        }
    }
    static appendSpec(spec, path = ResultsManager.resolvePath()) {
        const specs = ResultsManager.getSpecs(path);
        const existing = specs.findIndex((s) => s.name === spec.name);
        if (existing >= 0) {
            specs[existing] = {
                ...spec,
                assertions: [
                    ...(specs[existing]?.assertions ?? []),
                    ...spec.assertions,
                ],
            };
        }
        else {
            specs.push(spec);
        }
        try {
            (0, node_fs_1.mkdirSync)((0, node_path_1.dirname)(path), { recursive: true });
            (0, node_fs_1.writeFileSync)(path, JSON.stringify({ specs }, null, 0), 'utf8');
        }
        catch {
            // Never fail the Cypress run
        }
    }
}
exports.ResultsManager = ResultsManager;
