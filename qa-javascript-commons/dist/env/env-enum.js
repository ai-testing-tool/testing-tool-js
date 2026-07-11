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
})(EnvEnum || (exports.EnvEnum = EnvEnum = {}));
var EnvIngestEnum;
(function (EnvIngestEnum) {
    EnvIngestEnum["url"] = "QANALYZER_INGEST_URL";
    EnvIngestEnum["token"] = "QANALYZER_INGEST_TOKEN";
    EnvIngestEnum["timeoutMs"] = "QANALYZER_INGEST_TIMEOUT_MS";
    EnvIngestEnum["maxPayloadBytes"] = "QANALYZER_INGEST_MAX_PAYLOAD_BYTES";
})(EnvIngestEnum || (exports.EnvIngestEnum = EnvIngestEnum = {}));
var EnvFileEnum;
(function (EnvFileEnum) {
    EnvFileEnum["path"] = "QANALYZER_FILE_PATH";
})(EnvFileEnum || (exports.EnvFileEnum = EnvFileEnum = {}));
