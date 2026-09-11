"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clampPercent = clampPercent;
exports.chunkedUploadTotalSteps = chunkedUploadTotalSteps;
exports.progressAtStep = progressAtStep;
function clampPercent(value) {
    if (!Number.isFinite(value)) {
        return 0;
    }
    return Math.max(0, Math.min(100, Math.round(value)));
}
/** session + N chunks + complete = N + 2 steps */
function chunkedUploadTotalSteps(chunkCount) {
    return Math.max(1, chunkCount) + 2;
}
function progressAtStep(input) {
    const { completedSteps, totalSteps } = input;
    const percent = totalSteps <= 0 ? 100 : clampPercent((completedSteps / totalSteps) * 100);
    return {
        phase: input.phase,
        percent: input.phase === 'done' ? 100 : percent,
        completedSteps,
        totalSteps,
        chunkIndex: input.chunkIndex,
        totalChunks: input.totalChunks,
        message: input.message,
    };
}
