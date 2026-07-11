"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
class Logger {
    debugEnabled;
    constructor(debugEnabled = false) {
        this.debugEnabled = debugEnabled;
    }
    log(message) {
        console.log(`[INFO] qanalyzer: ${message}`);
    }
    logError(message, error) {
        console.error(`[ERROR] qanalyzer: ${message}`, error ?? '');
    }
    logDebug(message) {
        if (!this.debugEnabled)
            return;
        console.debug(`[DEBUG] qanalyzer: ${message}`);
    }
}
exports.Logger = Logger;
