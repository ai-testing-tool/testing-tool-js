"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadChunkedIngest = uploadChunkedIngest;
const ingest_http_1 = require("./ingest-http");
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
    const { plan, logger } = input;
    const totalChunks = plan.chunks.length;
    logger?.log(`Ingest: starting chunked upload sessionId=${plan.sessionId} chunks=${totalChunks}`);
    await postWithRetry(input, plan.sessionBody, 'session', input.timeoutMs, 'Ingest session');
    for (const chunk of plan.chunks) {
        await postWithRetry(input, chunk, 'chunk', input.timeoutMs, `Ingest chunk ${chunk.chunkIndex + 1}/${totalChunks}`);
        logger?.log(`Ingest: chunk ${chunk.chunkIndex + 1}/${totalChunks} accepted for sessionId=${plan.sessionId}`);
    }
    const response = await postWithRetry(input, plan.completeBody, 'complete', input.completeTimeoutMs, 'Ingest complete');
    logger?.log(`Ingest: chunked upload complete (HTTP ${response.status})`);
    return response;
}
