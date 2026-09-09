"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_CHUNK_MAX_BYTES = exports.DEFAULT_CHUNK_THRESHOLD_BYTES = exports.MAX_INGEST_SESSION_CHUNKS = void 0;
exports.createIngestSessionId = createIngestSessionId;
exports.planChunks = planChunks;
const node_crypto_1 = require("node:crypto");
exports.MAX_INGEST_SESSION_CHUNKS = 100;
exports.DEFAULT_CHUNK_THRESHOLD_BYTES = 3_500_000;
exports.DEFAULT_CHUNK_MAX_BYTES = 3_000_000;
function reportMetaFromPayload(report) {
    const { testResults: _ignored, ...reportMeta } = report;
    return reportMeta;
}
function estimateChunkBodyBytes(sessionId, chunkIndex, testResults) {
    return Buffer.byteLength(JSON.stringify({
        action: 'chunk',
        sessionId,
        chunkIndex,
        testResults,
    }), 'utf8');
}
function splitTestResults(sessionId, testResults, maxChunkBytes) {
    if (testResults.length === 0) {
        return [[]];
    }
    const groups = [];
    let current = [];
    for (const item of testResults) {
        const candidate = [...current, item];
        const candidateBytes = estimateChunkBodyBytes(sessionId, groups.length, candidate);
        if (current.length > 0 && candidateBytes > maxChunkBytes) {
            groups.push(current);
            current = [item];
        }
        else {
            current = candidate;
        }
        const currentBytes = estimateChunkBodyBytes(sessionId, groups.length, current);
        if (currentBytes > maxChunkBytes) {
            throw new Error(`Single test file result exceeds max chunk size (${maxChunkBytes} bytes); reduce attachments or split the suite`);
        }
    }
    if (current.length > 0) {
        groups.push(current);
    }
    return groups;
}
function createIngestSessionId(payload) {
    const fingerprint = [
        payload.projectKey,
        payload.launchName ?? '',
        payload.buildUrl ?? '',
        payload.gitCommitSha ?? '',
    ].join('|');
    if (!fingerprint.replace(/\|/g, '').trim()) {
        return (0, node_crypto_1.randomUUID)();
    }
    return (0, node_crypto_1.createHash)('sha256').update(fingerprint).digest('hex').slice(0, 32);
}
function planChunks(payload, options = {}) {
    const maxChunkBytes = options.maxChunkBytes ?? exports.DEFAULT_CHUNK_MAX_BYTES;
    const maxChunks = options.maxChunks ?? exports.MAX_INGEST_SESSION_CHUNKS;
    const sessionId = options.sessionId ?? createIngestSessionId(payload);
    const testResults = payload.report.testResults ?? [];
    const groups = splitTestResults(sessionId, testResults, maxChunkBytes);
    if (groups.length > maxChunks) {
        throw new Error(`Ingest report requires ${groups.length} chunks; maximum allowed is ${maxChunks}. Reduce report size or split CI jobs.`);
    }
    const sessionBody = {
        action: 'session',
        sessionId,
        projectKey: payload.projectKey,
        expectedChunks: groups.length,
        launchName: payload.launchName,
        format: payload.format,
        planId: payload.planId,
        planKey: payload.planKey,
        planName: payload.planName,
        fixVersion: payload.fixVersion,
        sprintName: payload.sprintName,
        buildUrl: payload.buildUrl,
        ciPlatform: payload.ciPlatform,
        reportMeta: reportMetaFromPayload(payload.report),
    };
    const chunks = groups.map((group, chunkIndex) => ({
        action: 'chunk',
        sessionId,
        chunkIndex,
        testResults: group,
    }));
    return {
        sessionId,
        sessionBody,
        chunks,
        completeBody: {
            action: 'complete',
            sessionId,
        },
    };
}
