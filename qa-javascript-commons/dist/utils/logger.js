"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
class Logger {
    debugEnabled;
    constructor(debugEnabled = false) {
        this.debugEnabled = debugEnabled;
    }
    log(message) {
        console.log(`[INFO] ai-testing-tool: ${message}`);
    }
    logError(message, error) {
        console.error(`[ERROR] ai-testing-tool: ${message}`, error ?? '');
    }
    logDebug(message) {
        if (!this.debugEnabled)
            return;
        console.debug(`[DEBUG] ai-testing-tool: ${message}`);
    }
}
exports.Logger = Logger;
