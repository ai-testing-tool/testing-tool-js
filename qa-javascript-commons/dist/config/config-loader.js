"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigLoader = void 0;
exports.loadConfig = loadConfig;
const fs_1 = require("fs");
const path_1 = require("path");
const DEFAULT_PATHS = ['qanalyzer.config.json', '.qanalyzerc'];
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function assertConfigShape(json, fileLabel) {
    if (!isRecord(json)) {
        throw new Error(`Invalid config: "${fileLabel}" must be a JSON object`);
    }
    if (json.mode !== undefined && typeof json.mode !== 'string') {
        throw new Error(`Invalid config: "mode" must be a string`);
    }
    if (json.projectKey !== undefined && typeof json.projectKey !== 'string') {
        throw new Error(`Invalid config: "projectKey" must be a string`);
    }
}
class ConfigLoader {
    paths;
    constructor(paths = DEFAULT_PATHS) {
        this.paths = paths;
    }
    read() {
        for (const configPath of this.paths) {
            const filePath = (0, path_1.join)(process.cwd(), configPath);
            try {
                return (0, fs_1.readFileSync)(filePath, 'utf8');
            }
            catch (error) {
                const code = error instanceof Error && 'code' in error
                    ? String(error.code)
                    : '';
                if (code !== 'ENOENT' && code !== 'EISDIR') {
                    throw new Error(`Cannot read config file "${configPath}"`, { cause: error });
                }
            }
        }
        return null;
    }
    load() {
        const data = this.read();
        if (!data)
            return null;
        let json;
        try {
            json = JSON.parse(data);
        }
        catch (error) {
            throw new Error('Invalid config: file is not valid JSON', { cause: error });
        }
        assertConfigShape(json, 'root');
        return json;
    }
}
exports.ConfigLoader = ConfigLoader;
function loadConfig(paths) {
    return new ConfigLoader(paths).load();
}
