"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_RETRY_POLICY = void 0;
exports.withRetry = withRetry;
const ingest_http_1 = require("./ingest-http");
exports.DEFAULT_RETRY_POLICY = {
    maxAttempts: 4,
    baseDelayMs: 1000,
    maxDelayMs: 30_000,
};
function retryDelayMs(policy, attempt) {
    const exponential = policy.baseDelayMs * 2 ** Math.max(0, attempt - 1);
    const capped = Math.min(policy.maxDelayMs, exponential);
    const jitter = Math.floor(Math.random() * 250);
    return capped + jitter;
}
function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
async function withRetry(operation, options = {}) {
    const policy = options.policy ?? exports.DEFAULT_RETRY_POLICY;
    const label = options.label ?? 'ingest';
    let lastError;
    for (let attempt = 1; attempt <= policy.maxAttempts; attempt += 1) {
        try {
            return await operation({ attempt, maxAttempts: policy.maxAttempts });
        }
        catch (error) {
            lastError = error;
            const canRetry = attempt < policy.maxAttempts && (0, ingest_http_1.isRetryableError)(error);
            if (!canRetry) {
                throw error;
            }
            const delayMs = retryDelayMs(policy, attempt);
            const message = error instanceof Error ? error.message : String(error);
            options.logger?.log(`${label} retry ${attempt}/${policy.maxAttempts - 1} in ${delayMs}ms: ${message}`);
            await sleep(delayMs);
        }
    }
    throw lastError;
}
