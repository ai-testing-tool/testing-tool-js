"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.envToConfig = envToConfig;
const env_enum_1 = require("./env-enum");
function readEnv(name) {
    const value = process.env[name];
    return value === '' ? undefined : value;
}
function readBoolean(name) {
    const value = readEnv(name);
    if (value === undefined)
        return undefined;
    return value === '1' || value.toLowerCase() === 'true';
}
function readNumber(name) {
    const value = readEnv(name);
    if (value === undefined)
        return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
}
/** Map QANALYZER_* env vars to nested config (highest precedence in composeOptions). */
function envToConfig() {
    const config = {
        mode: readEnv(env_enum_1.EnvEnum.mode),
        fallback: readEnv(env_enum_1.EnvEnum.fallback),
        debug: readBoolean(env_enum_1.EnvEnum.debug),
        projectKey: readEnv(env_enum_1.EnvEnum.projectKey),
        launchName: readEnv(env_enum_1.EnvEnum.launchName),
        planId: readEnv(env_enum_1.EnvEnum.planId),
        planKey: readEnv(env_enum_1.EnvEnum.planKey),
        planName: readEnv(env_enum_1.EnvEnum.planName),
        fixVersion: readEnv(env_enum_1.EnvEnum.fixVersion),
        sprintName: readEnv(env_enum_1.EnvEnum.sprintName),
        ingest: {
            url: readEnv(env_enum_1.EnvIngestEnum.url),
            token: readEnv(env_enum_1.EnvIngestEnum.token),
            timeoutMs: readNumber(env_enum_1.EnvIngestEnum.timeoutMs),
            completeTimeoutMs: readNumber(env_enum_1.EnvIngestEnum.completeTimeoutMs),
            maxPayloadBytes: readNumber(env_enum_1.EnvIngestEnum.maxPayloadBytes),
            chunkThresholdBytes: readNumber(env_enum_1.EnvIngestEnum.chunkThresholdBytes),
            chunkMaxBytes: readNumber(env_enum_1.EnvIngestEnum.chunkMaxBytes),
            maxRetries: readNumber(env_enum_1.EnvIngestEnum.maxRetries),
            retryBaseDelayMs: readNumber(env_enum_1.EnvIngestEnum.retryBaseDelayMs),
        },
        file: {
            path: readEnv(env_enum_1.EnvFileEnum.path),
        },
    };
    if (config.ingest &&
        Object.values(config.ingest).every((value) => value === undefined)) {
        delete config.ingest;
    }
    if (config.file && Object.values(config.file).every((value) => value === undefined)) {
        delete config.file;
    }
    return config;
}
