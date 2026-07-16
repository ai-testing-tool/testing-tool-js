"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vitestReporterRun = vitestReporterRun;
exports.jestReporterRun = jestReporterRun;
exports.cypressReporterRun = cypressReporterRun;
exports.playwrightReporterRun = playwrightReporterRun;
exports.wdioReporterRun = wdioReporterRun;
exports.mochaReporterRun = mochaReporterRun;
exports.cucumberjsReporterRun = cucumberjsReporterRun;
exports.playwrightBrowserInstallCommand = playwrightBrowserInstallCommand;
exports.reporterPreRunScripts = reporterPreRunScripts;
exports.frameworkReporterRun = frameworkReporterRun;
exports.reporterPackageName = reporterPackageName;
exports.reporterFrameworkLabel = reporterFrameworkLabel;
exports.reporterConfigHint = reporterConfigHint;
exports.reporterIngestEnvLines = reporterIngestEnvLines;
exports.planCiVariableHints = planCiVariableHints;
exports.versionTagCiVariableHints = versionTagCiVariableHints;
exports.assertReporterFramework = assertReporterFramework;
/** Vitest run when @qanalyzer/forge-vitest is configured in vitest.config.ts. */
function vitestReporterRun() {
    return 'npx vitest run';
}
/** Jest run when @qanalyzer/forge-jest is configured in jest.config.js. */
function jestReporterRun() {
    return 'npx jest --runInBand';
}
/** Cypress run when @qanalyzer/forge-cypress is configured in cypress.config.js. */
function cypressReporterRun() {
    return 'npx cypress run';
}
/** Playwright run when @qanalyzer/forge-playwright is configured in playwright.config.ts. */
function playwrightReporterRun() {
    return 'npx playwright test';
}
/** WebdriverIO run when @qanalyzer/forge-wdio is configured in wdio.conf.js. */
function wdioReporterRun() {
    return 'npx wdio run wdio.conf.js';
}
/** Mocha run when @qanalyzer/forge-mocha is configured in .mocharc.js. */
function mochaReporterRun() {
    return 'npx mocha';
}
/** CucumberJS run when @qanalyzer/forge-cucumberjs is configured in cucumber.js. */
function cucumberjsReporterRun() {
    return 'npx cucumber-js';
}
/** Browser install for Playwright CI (before test run). */
function playwrightBrowserInstallCommand() {
    return 'npx playwright install --with-deps';
}
/** Extra pre-run script lines after npm ci (e.g. browser install). */
function reporterPreRunScripts(ctx) {
    if (ctx.framework === 'playwright') {
        return [playwrightBrowserInstallCommand()];
    }
    return [];
}
function frameworkReporterRun(ctx) {
    if (ctx.framework === 'jest')
        return jestReporterRun();
    if (ctx.framework === 'mocha')
        return mochaReporterRun();
    if (ctx.framework === 'cucumberjs')
        return cucumberjsReporterRun();
    if (ctx.framework === 'cypress')
        return cypressReporterRun();
    if (ctx.framework === 'playwright')
        return playwrightReporterRun();
    if (ctx.framework === 'wdio')
        return wdioReporterRun();
    return vitestReporterRun();
}
function reporterPackageName(ctx) {
    if (ctx.framework === 'jest')
        return '@qanalyzer/forge-jest';
    if (ctx.framework === 'mocha')
        return '@qanalyzer/forge-mocha';
    if (ctx.framework === 'cucumberjs')
        return '@qanalyzer/forge-cucumberjs';
    if (ctx.framework === 'cypress')
        return '@qanalyzer/forge-cypress';
    if (ctx.framework === 'playwright')
        return '@qanalyzer/forge-playwright';
    if (ctx.framework === 'wdio')
        return '@qanalyzer/forge-wdio';
    return '@qanalyzer/forge-vitest';
}
function reporterFrameworkLabel(ctx) {
    if (ctx.framework === 'jest')
        return 'Jest';
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
    return 'Vitest';
}
/** Short config hint for CI comments. */
function reporterConfigHint(ctx) {
    if (ctx.framework === 'jest') {
        return "jest.config.js reporters: ['default', '@qanalyzer/forge-jest']";
    }
    if (ctx.framework === 'mocha') {
        return ".mocharc.js reporter: '@qanalyzer/forge-mocha'";
    }
    if (ctx.framework === 'cucumberjs') {
        return "cucumber.js format: ['progress', '@qanalyzer/forge-cucumberjs']";
    }
    if (ctx.framework === 'cypress') {
        return 'cypress.config.js reporter: @qanalyzer/forge-cypress (+ plugin/metadata in setupNodeEvents)';
    }
    if (ctx.framework === 'playwright') {
        return "playwright.config.ts reporter: [['list'], ['@qanalyzer/forge-playwright']] (+ npx playwright install)";
    }
    if (ctx.framework === 'wdio') {
        return 'wdio.conf.js: @qanalyzer/forge-wdio reporter + QaWdioService + hooks; headless Chrome (goog:chromeOptions --headless=new)';
    }
    return "vitest.config.ts reporters: ['default', '@qanalyzer/forge-vitest']";
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
        planNameHint: 'QANALYZER_PLAN_NAME',
    };
}
/** Shared optional plan env vars for CI variable checklists (FR158). */
function planCiVariableHints() {
    return [
        {
            name: 'QANALYZER_PLAN_NAME',
            description: 'Optional Test Plan display name (auto-creates stub unless require_existing_plan)',
            platformHint: 'Set as a CI variable/env when attaching launches to a plan',
        },
        {
            name: 'QANALYZER_PLAN_ID',
            description: 'Optional Test Plan UUID from QAnalyzer Plans UI',
            platformHint: 'Prefer over plan name when the plan already exists',
        },
        {
            name: 'QANALYZER_PLAN_KEY',
            description: 'Optional Test Plan slug (plan_key)',
            platformHint: 'Alternative to plan name / id',
        },
    ];
}
/** Optional fix version / sprint tags (FR21). */
function versionTagCiVariableHints() {
    return [
        {
            name: 'QANALYZER_FIX_VERSION',
            description: 'Optional fix version / release tag on the launch',
            platformHint: 'Set per release pipeline (e.g. 2.4.0)',
        },
        {
            name: 'QANALYZER_SPRINT',
            description: 'Optional sprint name tag on the launch',
            platformHint: 'Set per sprint or iteration',
        },
    ];
}
function assertReporterFramework(ctx) {
    if (ctx.framework !== 'vitest' &&
        ctx.framework !== 'jest' &&
        ctx.framework !== 'mocha' &&
        ctx.framework !== 'cucumberjs' &&
        ctx.framework !== 'cypress' &&
        ctx.framework !== 'playwright' &&
        ctx.framework !== 'wdio') {
        throw new Error('Reporter path requires Vitest (@qanalyzer/forge-vitest), Jest (@qanalyzer/forge-jest), Mocha (@qanalyzer/forge-mocha), CucumberJS (@qanalyzer/forge-cucumberjs), Cypress (@qanalyzer/forge-cypress), Playwright (@qanalyzer/forge-playwright), or WebdriverIO (@qanalyzer/forge-wdio)');
    }
}
