import type { CiTemplateContext, CiVariableHint } from '../types';
/** Vitest run when qa-vitest is configured in vitest.config.ts. */
export declare function vitestReporterRun(): string;
/** Jest run when qa-jest is configured in jest.config.js. */
export declare function jestReporterRun(): string;
/** Cypress run when qa-cypress is configured in cypress.config.js. */
export declare function cypressReporterRun(): string;
/** Playwright run when qa-playwright is configured in playwright.config.ts. */
export declare function playwrightReporterRun(): string;
/** WebdriverIO run when qa-wdio is configured in wdio.conf.js. */
export declare function wdioReporterRun(): string;
/** Mocha run when qa-mocha is configured in .mocharc.js. */
export declare function mochaReporterRun(): string;
/** CucumberJS run when qa-cucumberjs is configured in cucumber.js. */
export declare function cucumberjsReporterRun(): string;
/** Browser install for Playwright CI (before test run). */
export declare function playwrightBrowserInstallCommand(): string;
/** Extra pre-run script lines after npm ci (e.g. browser install). */
export declare function reporterPreRunScripts(ctx: CiTemplateContext): string[];
export declare function frameworkReporterRun(ctx: CiTemplateContext): string;
export declare function reporterPackageName(ctx: CiTemplateContext): string;
export declare function reporterFrameworkLabel(ctx: CiTemplateContext): string;
/** Short config hint for CI comments. */
export declare function reporterConfigHint(ctx: CiTemplateContext): string;
/**
 * Env block lines for reporter ingest (platform supplies expression values).
 * Caller wraps in YAML/Groovy structure.
 */
export declare function reporterIngestEnvLines(ctx: CiTemplateContext): {
    mode: string;
    url: string;
    token: string;
    project: string;
    /** Optional — document in templates; set in CI when attaching a Test Plan. */
    planNameHint: string;
};
/** Shared optional plan env vars for CI variable checklists (FR158). */
export declare function planCiVariableHints(): CiVariableHint[];
/** Optional fix version / sprint tags (FR21). */
export declare function versionTagCiVariableHints(): CiVariableHint[];
export declare function assertReporterFramework(ctx: CiTemplateContext): void;
