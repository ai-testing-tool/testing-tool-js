import type { CiTemplateContext, CiTemplateResult } from '../types';
/**
 * GitHub Actions — upload (Vitest/Jest/Playwright) or reporter
 * (@qanalyzer/forge-vitest / @qanalyzer/forge-jest / @qanalyzer/forge-mocha / @qanalyzer/forge-cucumberjs / @qanalyzer/forge-cypress / @qanalyzer/forge-playwright / @qanalyzer/forge-wdio).
 */
export declare function renderGithubUpload(ctx: CiTemplateContext): CiTemplateResult;
