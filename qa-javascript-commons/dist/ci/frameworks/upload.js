"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadCliCommand = uploadCliCommand;
exports.indentUploadCli = indentUploadCli;
exports.frameworkTestCommand = frameworkTestCommand;
exports.frameworkLabel = frameworkLabel;
/**
 * Shared upload invocation — matches ci-upload-helper.md.
 * Callers supply platform-quoted project/launch expressions.
 */
function uploadCliCommand(ctx) {
    const reportFile = ctx.reportFile ?? 'qanalyzer-results.json';
    const project = ctx.projectKeyExpr ?? ctx.projectKey;
    const launch = ctx.launchNameExpr ?? 'qanalyzer';
    return [
        'npx qa-forge-api-client \\',
        `  --project "${project}" \\`,
        `  --launch "${launch}" \\`,
        `  --report ${reportFile}`,
    ].join('\n');
}
/** Indent every line of the shared upload CLI (for YAML `|` / Groovy blocks). */
function indentUploadCli(ctx, spaces) {
    const pad = ' '.repeat(spaces);
    return uploadCliCommand(ctx)
        .split('\n')
        .map((line) => `${pad}${line}`)
        .join('\n');
}
function frameworkTestCommand(ctx) {
    const reportFile = ctx.reportFile ?? 'qanalyzer-results.json';
    if (ctx.framework === 'vitest') {
        return `npx vitest run --reporter=json --outputFile=${reportFile}`;
    }
    return `npx jest --json --outputFile=${reportFile}`;
}
function frameworkLabel(ctx) {
    return ctx.framework === 'vitest' ? 'Vitest' : 'Jest';
}
