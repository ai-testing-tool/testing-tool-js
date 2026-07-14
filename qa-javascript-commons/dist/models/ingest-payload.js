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
    if (!input.projectKey?.trim()) {
        throw new Error('projectKey is required to build an ingest payload');
    }
    const base = {
        projectKey: input.projectKey.trim(),
        launchName: input.launchName,
        planId: input.planId?.trim() || undefined,
        planKey: input.planKey?.trim() || undefined,
        planName: input.planName?.trim() || undefined,
        fixVersion: input.fixVersion?.trim() || undefined,
        sprintName: input.sprintName?.trim() || undefined,
        ciPlatform: input.ci?.ciPlatform,
        buildUrl: input.ci?.buildUrl,
        gitCommitSha: input.ci?.gitCommitSha,
        gitBranch: input.ci?.gitBranch,
        gitAuthorName: input.ci?.gitAuthorName,
        gitAuthorEmail: input.ci?.gitAuthorEmail,
    };
    if (input.format === 'junit-xml') {
        if (typeof input.report !== 'string' || !input.report.trim()) {
            throw new Error('junit-xml format requires report to be a non-empty XML string');
        }
        return {
            ...base,
            format: 'junit-xml',
            report: input.report,
        };
    }
    if (typeof input.report === 'string') {
        throw new Error('Jest/Vitest ingest requires a JSON report object (use --format junit-xml for XML)');
    }
    const normalized = normalizeJestReport(input.report);
    return {
        ...base,
        format: input.format ?? 'jest-json',
        report: {
            ...normalized,
            testResults: normalized.testResults ?? [],
        },
    };
}
function estimatePayloadBytes(payload) {
    return Buffer.byteLength(JSON.stringify(payload), 'utf8');
}
