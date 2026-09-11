"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IngestClient = void 0;
const models_1 = require("../models");
const ingest_chunk_plan_1 = require("./ingest-chunk-plan");
const ingest_http_1 = require("./ingest-http");
const ingest_progress_1 = require("./ingest-progress");
const ingest_retry_1 = require("./ingest-retry");
const ingest_session_upload_1 = require("./ingest-session-upload");
const DEFAULT_TIMEOUT_MS = 60_000;
const DEFAULT_COMPLETE_TIMEOUT_MS = 120_000;
class IngestClient {
    url;
    token;
    timeoutMs;
    completeTimeoutMs;
    maxPayloadBytes;
    chunkThresholdBytes;
    chunkMaxBytes;
    retryPolicy;
    logger;
    onProgress;
    constructor(options = {}) {
        this.url = options.url;
        this.token = options.token;
        this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
        this.completeTimeoutMs = options.completeTimeoutMs ?? DEFAULT_COMPLETE_TIMEOUT_MS;
        this.maxPayloadBytes = options.maxPayloadBytes ?? 4_500_000;
        this.chunkThresholdBytes = options.chunkThresholdBytes ?? ingest_chunk_plan_1.DEFAULT_CHUNK_THRESHOLD_BYTES;
        this.chunkMaxBytes = options.chunkMaxBytes ?? ingest_chunk_plan_1.DEFAULT_CHUNK_MAX_BYTES;
        this.retryPolicy = {
            maxAttempts: options.maxRetries ?? ingest_retry_1.DEFAULT_RETRY_POLICY.maxAttempts,
            baseDelayMs: options.retryBaseDelayMs ?? ingest_retry_1.DEFAULT_RETRY_POLICY.baseDelayMs,
            maxDelayMs: ingest_retry_1.DEFAULT_RETRY_POLICY.maxDelayMs,
        };
        this.logger = options.logger;
        this.onProgress = options.onProgress;
    }
    async send(payload) {
        if (!this.url) {
            throw new Error('ingest.url (or AI_TESTING_TOOL_INGEST_URL) is required in ingest mode');
        }
        if (!this.token) {
            throw new Error('ingest.token (or AI_TESTING_TOOL_INGEST_TOKEN) is required in ingest mode');
        }
        const bytes = (0, models_1.estimatePayloadBytes)(payload);
        if (bytes <= this.chunkThresholdBytes && bytes <= this.maxPayloadBytes) {
            return this.sendDirect(payload);
        }
        const plan = (0, ingest_chunk_plan_1.planChunks)(payload, { maxChunkBytes: this.chunkMaxBytes });
        return (0, ingest_session_upload_1.uploadChunkedIngest)({
            url: this.url,
            token: this.token,
            plan,
            timeoutMs: this.timeoutMs,
            completeTimeoutMs: this.completeTimeoutMs,
            retryPolicy: this.retryPolicy,
            logger: this.logger,
            onProgress: this.onProgress,
        });
    }
    async sendDirect(payload) {
        const bytes = (0, models_1.estimatePayloadBytes)(payload);
        if (bytes > this.maxPayloadBytes) {
            throw new Error(`Ingest payload is ${bytes} bytes; max allowed is ${this.maxPayloadBytes} bytes`);
        }
        this.onProgress?.((0, ingest_progress_1.progressAtStep)({
            phase: 'starting',
            completedSteps: 0,
            totalSteps: 1,
            message: 'Uploading report',
        }));
        const response = await (0, ingest_retry_1.withRetry)(async () => (0, ingest_http_1.postIngestJson)({
            url: this.url,
            token: this.token,
            body: payload,
            timeoutMs: this.timeoutMs,
        }), {
            policy: this.retryPolicy,
            logger: this.logger,
            label: 'Ingest',
        });
        this.onProgress?.((0, ingest_progress_1.progressAtStep)({
            phase: 'done',
            completedSteps: 1,
            totalSteps: 1,
            message: `Ingest accepted (HTTP ${response.status})`,
        }));
        this.logger?.log(`Ingest accepted (HTTP ${response.status})`);
        return response;
    }
}
exports.IngestClient = IngestClient;
