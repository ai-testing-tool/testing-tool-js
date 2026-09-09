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
    const reportFile = ctx.reportFile ?? 'ai-testing-tool-results.json';
    const project = ctx.projectKeyExpr ?? ctx.projectKey;
    const launch = ctx.launchNameExpr ?? 'ai-testing-tool';
    return [
        'npx @ai-testing-tool/forge-api-client \\',
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
    const reportFile = ctx.reportFile ?? 'ai-testing-tool-results.json';
    if (ctx.framework === 'vitest') {
        return `npx vitest run --reporter=json --outputFile=${reportFile}`;
    }
    if (ctx.framework === 'jest') {
        return `npx jest --json --outputFile=${reportFile}`;
    }
    if (ctx.framework === 'playwright') {
        // Native Playwright JSON reporter → stdout (FR109 Path A)
        return `npx playwright test --reporter=json > ${reportFile}`;
    }
    throw new Error('Upload JSON path is not supported for Mocha, CucumberJS, Cypress, or WebdriverIO — use ingestPath: reporter (@ai-testing-tool/forge-mocha / @ai-testing-tool/forge-cucumberjs / @ai-testing-tool/forge-cypress / @ai-testing-tool/forge-wdio)');
}
function frameworkLabel(ctx) {
    if (ctx.framework === 'vitest')
        return 'Vitest';
    if (ctx.framework === 'mocha')
        return 'Mocha';
    if (ctx.framework === 'cucumberjs')
        return 'CucumberJS';
    if (ctx.framework === 'cypress')
        return 'Cypress';
    if (ctx.framework === 'playwright')
        return 'Playwright';
    if (ctx.framework === 'wdio')
        return 'WebdriverIO';
    return 'Jest';
}
