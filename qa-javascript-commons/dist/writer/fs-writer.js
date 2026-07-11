"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FsWriter = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const fs_2 = require("fs");
class FsWriter {
    path;
    constructor(options) {
        this.path = options?.path ?? './qanalyzer-results.json';
    }
    writePayload(payload) {
        const target = (0, path_1.resolve)(process.cwd(), this.path);
        (0, fs_2.mkdirSync)((0, path_1.dirname)(target), { recursive: true });
        (0, fs_1.writeFileSync)(target, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
        return target;
    }
}
exports.FsWriter = FsWriter;
