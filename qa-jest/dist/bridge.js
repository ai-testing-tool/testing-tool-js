"use strict";
/**
 * Cross-environment bridge for Jest qa helpers ↔ reporter.
 *
 * Jest jsdom (and other custom environments) use a separate `globalThis` from the
 * reporter's Node context. Node's `process` is the same object in both, so we
 * park the bridge there when `--runInBand` (required for helpers).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getQaJestBridge = getQaJestBridge;
exports.setQaJestBridge = setQaJestBridge;
exports.clearQaJestBridge = clearQaJestBridge;
const PROCESS_KEY = '__QA_JEST_BRIDGE__';
function processSlot() {
    try {
        return typeof process !== 'undefined' ? process : undefined;
    }
    catch {
        return undefined;
    }
}
function getQaJestBridge() {
    return processSlot()?.[PROCESS_KEY] ?? globalThis.__QA_JEST_BRIDGE__;
}
function setQaJestBridge(bridge) {
    const proc = processSlot();
    if (proc) {
        proc[PROCESS_KEY] = bridge;
    }
    globalThis.__QA_JEST_BRIDGE__ = bridge;
}
function clearQaJestBridge() {
    const proc = processSlot();
    if (proc) {
        delete proc[PROCESS_KEY];
    }
    try {
        delete globalThis.__QA_JEST_BRIDGE__;
    }
    catch {
        globalThis.__QA_JEST_BRIDGE__ = undefined;
    }
}
