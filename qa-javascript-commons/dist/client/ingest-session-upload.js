"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadChunkedIngest = uploadChunkedIngest;
const ingest_http_1 = require("./ingest-http");
const ingest_progress_1 = require("./ingest-progress");
const ingest_retry_1 = require("./ingest-retry");
async function postWithRetry(input, body, action, timeoutMs, label) {
    return (0, ingest_retry_1.withRetry)(async () => (0, ingest_http_1.postIngestJson)({
        url: input.url,
        token: input.token,
        body,
        timeoutMs,
        action,
    }), {
        policy: input.retryPolicy,
        logger: input.logger,
        label,
    });
}
async function uploadChunkedIngest(input) {
    const { plan, logger, onProgress } = input;
    const totalChunks = plan.chunks.length;
    const totalSteps = (0, ingest_progress_1.chunkedUploadTotalSteps)(totalChunks);
    let completedSteps = 0;
    const emit = (phase, message, extra) => {
        onProgress?.((0, ingest_progress_1.progressAtStep)({
            phase,
            completedSteps,
            totalSteps,
            message,
            chunkIndex: extra?.chunkIndex,
            totalChunks,
        }));
    };
    emit('starting', `Starting chunked upload (${totalChunks} chunks)`);
    logger?.log(`Ingest: starting chunked upload sessionId=${plan.sessionId} chunks=${totalChunks}`);
    await postWithRetry(input, plan.sessionBody, 'session', input.timeoutMs, 'Ingest session');
    completedSteps = 1;
    emit('session', 'Session created');
    for (const chunk of plan.chunks) {
        await postWithRetry(input, chunk, 'chunk', input.timeoutMs, `Ingest chunk ${chunk.chunkIndex + 1}/${totalChunks}`);
        completedSteps += 1;
        const label = `Chunk ${chunk.chunkIndex + 1}/${totalChunks} accepted`;
        emit('chunk', label, { chunkIndex: chunk.chunkIndex });
        logger?.log(`Ingest: ${label} for sessionId=${plan.sessionId}`);
    }
    const response = await postWithRetry(input, plan.completeBody, 'complete', input.completeTimeoutMs, 'Ingest complete');
    completedSteps = totalSteps;
    emit('complete', `Complete accepted (HTTP ${response.status})`);
    emit('done', 'Upload finished');
    logger?.log(`Ingest: chunked upload complete (HTTP ${response.status})`);
    return response;
}
