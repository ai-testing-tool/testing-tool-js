import type { CiTemplateContext, CiTemplateResult } from '../types';
/**
 * GitHub Actions — upload (Vitest/Jest/Playwright) or reporter
 * (qa-forge-vitest / qa-forge-jest / qa-forge-mocha / qa-forge-cucumberjs / qa-forge-cypress / qa-forge-playwright / qa-forge-wdio).
 */
export declare function renderGithubUpload(ctx: CiTemplateContext): CiTemplateResult;
