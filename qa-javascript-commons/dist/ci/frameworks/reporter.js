"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vitestReporterRun = vitestReporterRun;
exports.reporterIngestEnvLines = reporterIngestEnvLines;
exports.assertVitestReporter = assertVitestReporter;
/** Vitest run when qa-vitest is configured in vitest.config.ts. */
function vitestReporterRun() {
    return 'npx vitest run';
}
/**
 * Env block lines for reporter ingest (platform supplies expression values).
 * Caller wraps in YAML/Groovy structure.
 */
function reporterIngestEnvLines(ctx) {
    return {
        mode: 'ingest',
        url: ctx.ingestUrlExpr ?? ctx.ingestUrlSecret,
        token: ctx.ingestTokenExpr ?? ctx.ingestTokenSecret,
        project: ctx.projectKeyExpr ?? ctx.projectKey,
    };
}
function assertVitestReporter(ctx) {
    if (ctx.framework !== 'vitest') {
        throw new Error('Reporter path is only supported for Vitest (qa-vitest)');
    }
}
