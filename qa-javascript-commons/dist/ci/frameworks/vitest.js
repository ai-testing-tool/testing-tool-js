"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vitestJsonRun = vitestJsonRun;
exports.vitestReporterEnv = vitestReporterEnv;
function vitestJsonRun(reportFile) {
    return `npx vitest run --reporter=json --outputFile=${reportFile}`;
}
function vitestReporterEnv() {
    return 'AI_TESTING_TOOL_MODE: ingest';
}
