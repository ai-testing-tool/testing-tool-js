"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeJestReport = normalizeJestReport;
exports.buildIngestPayload = buildIngestPayload;
exports.estimatePayloadBytes = estimatePayloadBytes;
function normalizeJestReport(report) {
    return {
        ...report,
        testResults: Array.isArray(report.testResults) ? report.testResults : [],
    };
}
function buildIngestPayload(input) {
    const normalized = normalizeJestReport(input.report);
    if (!input.projectKey?.trim()) {
        throw new Error('projectKey is required to build an ingest payload');
    }
    return {
        projectKey: input.projectKey.trim(),
        launchName: input.launchName,
        format: input.format ?? 'jest-json',
        ciPlatform: input.ci?.ciPlatform,
        buildUrl: input.ci?.buildUrl,
        gitCommitSha: input.ci?.gitCommitSha,
        gitBranch: input.ci?.gitBranch,
        gitAuthorName: input.ci?.gitAuthorName,
        gitAuthorEmail: input.ci?.gitAuthorEmail,
        report: {
            ...normalized,
            testResults: normalized.testResults ?? [],
        },
    };
}
function estimatePayloadBytes(payload) {
    return Buffer.byteLength(JSON.stringify(payload), 'utf8');
}
