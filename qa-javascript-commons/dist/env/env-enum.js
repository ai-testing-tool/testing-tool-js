"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnvFileEnum = exports.EnvIngestEnum = exports.EnvEnum = void 0;
var EnvEnum;
(function (EnvEnum) {
    EnvEnum["mode"] = "QANALYZER_MODE";
    EnvEnum["fallback"] = "QANALYZER_FALLBACK";
    EnvEnum["debug"] = "QANALYZER_DEBUG";
    EnvEnum["projectKey"] = "QANALYZER_PROJECT_KEY";
    EnvEnum["launchName"] = "QANALYZER_LAUNCH_NAME";
    EnvEnum["planId"] = "QANALYZER_PLAN_ID";
    EnvEnum["planKey"] = "QANALYZER_PLAN_KEY";
    EnvEnum["planName"] = "QANALYZER_PLAN_NAME";
    EnvEnum["fixVersion"] = "QANALYZER_FIX_VERSION";
    EnvEnum["sprintName"] = "QANALYZER_SPRINT";
})(EnvEnum || (exports.EnvEnum = EnvEnum = {}));
var EnvIngestEnum;
(function (EnvIngestEnum) {
    EnvIngestEnum["url"] = "QANALYZER_INGEST_URL";
    EnvIngestEnum["token"] = "QANALYZER_INGEST_TOKEN";
    EnvIngestEnum["timeoutMs"] = "QANALYZER_INGEST_TIMEOUT_MS";
    EnvIngestEnum["completeTimeoutMs"] = "QANALYZER_INGEST_COMPLETE_TIMEOUT_MS";
    EnvIngestEnum["maxPayloadBytes"] = "QANALYZER_INGEST_MAX_PAYLOAD_BYTES";
    EnvIngestEnum["chunkThresholdBytes"] = "QANALYZER_INGEST_CHUNK_THRESHOLD_BYTES";
    EnvIngestEnum["chunkMaxBytes"] = "QANALYZER_INGEST_CHUNK_MAX_BYTES";
    EnvIngestEnum["maxRetries"] = "QANALYZER_INGEST_MAX_RETRIES";
    EnvIngestEnum["retryBaseDelayMs"] = "QANALYZER_INGEST_RETRY_BASE_DELAY_MS";
})(EnvIngestEnum || (exports.EnvIngestEnum = EnvIngestEnum = {}));
var EnvFileEnum;
(function (EnvFileEnum) {
    EnvFileEnum["path"] = "QANALYZER_FILE_PATH";
})(EnvFileEnum || (exports.EnvFileEnum = EnvFileEnum = {}));
