"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeJestReport = normalizeJestReport;
exports.buildIngestPayload = buildIngestPayload;
exports.estimatePayloadBytes = estimatePayloadBytes;
const report_file_path_1 = require("../utils/report-file-path");
function normalizeJestReport(report) {
    const testResults = Array.isArray(report.testResults) ? report.testResults : [];
    return {
        ...report,
        testResults: testResults.map((file) => ({
            ...file,
            name: file.name != null ? (0, report_file_path_1.normalizeReportFilePath)(file.name) : file.name,
        })),
    };
}
function buildIngestPayload(input) {
    if (!input.projectKey?.trim()) {
        throw new Error('projectKey is required to build an ingest payload');
    }
    if (!input.report || typeof input.report !== 'object') {
        throw new Error('Jest/Vitest ingest requires a JSON report object');
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
