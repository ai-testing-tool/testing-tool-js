"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnvFileEnum = exports.EnvIngestEnum = exports.EnvEnum = void 0;
var EnvEnum;
(function (EnvEnum) {
    EnvEnum["mode"] = "AI_TESTING_TOOL_MODE";
    EnvEnum["fallback"] = "AI_TESTING_TOOL_FALLBACK";
    EnvEnum["debug"] = "AI_TESTING_TOOL_DEBUG";
    EnvEnum["projectKey"] = "AI_TESTING_TOOL_PROJECT_KEY";
    EnvEnum["launchName"] = "AI_TESTING_TOOL_LAUNCH_NAME";
    EnvEnum["planId"] = "AI_TESTING_TOOL_PLAN_ID";
    EnvEnum["planKey"] = "AI_TESTING_TOOL_PLAN_KEY";
    EnvEnum["planName"] = "AI_TESTING_TOOL_PLAN_NAME";
    EnvEnum["fixVersion"] = "AI_TESTING_TOOL_FIX_VERSION";
    EnvEnum["sprintName"] = "AI_TESTING_TOOL_SPRINT";
})(EnvEnum || (exports.EnvEnum = EnvEnum = {}));
var EnvIngestEnum;
(function (EnvIngestEnum) {
    EnvIngestEnum["url"] = "AI_TESTING_TOOL_INGEST_URL";
    EnvIngestEnum["token"] = "AI_TESTING_TOOL_INGEST_TOKEN";
    EnvIngestEnum["timeoutMs"] = "AI_TESTING_TOOL_INGEST_TIMEOUT_MS";
    EnvIngestEnum["completeTimeoutMs"] = "AI_TESTING_TOOL_INGEST_COMPLETE_TIMEOUT_MS";
    EnvIngestEnum["maxPayloadBytes"] = "AI_TESTING_TOOL_INGEST_MAX_PAYLOAD_BYTES";
    EnvIngestEnum["chunkThresholdBytes"] = "AI_TESTING_TOOL_INGEST_CHUNK_THRESHOLD_BYTES";
    EnvIngestEnum["chunkMaxBytes"] = "AI_TESTING_TOOL_INGEST_CHUNK_MAX_BYTES";
    EnvIngestEnum["maxRetries"] = "AI_TESTING_TOOL_INGEST_MAX_RETRIES";
    EnvIngestEnum["retryBaseDelayMs"] = "AI_TESTING_TOOL_INGEST_RETRY_BASE_DELAY_MS";
})(EnvIngestEnum || (exports.EnvIngestEnum = EnvIngestEnum = {}));
var EnvFileEnum;
(function (EnvFileEnum) {
    EnvFileEnum["path"] = "AI_TESTING_TOOL_FILE_PATH";
})(EnvFileEnum || (exports.EnvFileEnum = EnvFileEnum = {}));
