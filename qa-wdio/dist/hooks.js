"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hooksLifecycle = void 0;
exports.beforeRunHook = beforeRunHook;
exports.afterRunHook = afterRunHook;
exports.assertHooksForMode = assertHooksForMode;
const qa_forge_commons_1 = require("qa-forge-commons");
const publish_1 = require("./publish");
/**
 * Tracks onPrepare/onComplete hook pairing (FR123 / NFR33).
 */
exports.hooksLifecycle = {
    beforeCalled: false,
    afterCalled: false,
    reset() {
        this.beforeCalled = false;
        this.afterCalled = false;
    },
};
function isOff(mode) {
    return mode === qa_forge_commons_1.ModeEnum.off || mode === 'off' || mode == null;
}
/**
 * Call from `wdio.conf.js` `onPrepare`.
 * Initializes commons reporter config (default mode=off).
 */
async function beforeRunHook(options = {}) {
    exports.hooksLifecycle.beforeCalled = true;
    qa_forge_commons_1.QAnalyzerReporter.getInstance(options);
}
/**
 * Call from `wdio.conf.js` `onComplete`.
 * Publishes buffered FR41 results when mode is ingest|file (with onRunnerEnd).
 */
async function afterRunHook() {
    exports.hooksLifecycle.afterCalled = true;
    try {
        await (0, publish_1.publishBufferedResults)();
    }
    catch {
        // Never fail the WDIO run
    }
}
/**
 * Fail fast when ingest/file mode runs without hooks (NFR33).
 */
function assertHooksForMode(mode, debug = false) {
    if (isOff(mode))
        return;
    if (exports.hooksLifecycle.beforeCalled && exports.hooksLifecycle.afterCalled)
        return;
    // Allow publish from onRunnerEnd before onComplete — only error if before never ran.
    if (exports.hooksLifecycle.beforeCalled)
        return;
    const message = 'qa-forge-wdio requires onPrepare → beforeRunHook() and onComplete → afterRunHook() when QANALYZER_MODE is ingest or file (NFR33)';
    if (debug) {
        throw new Error(message);
    }
    // eslint-disable-next-line no-console
    console.error(`[qa-forge-wdio] ${message}`);
}
