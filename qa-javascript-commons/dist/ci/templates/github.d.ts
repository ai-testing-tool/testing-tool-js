import type { CiTemplateContext, CiTemplateResult } from '../types';
/**
 * GitHub Actions — upload (Vitest/Jest/Playwright) or reporter
 * (qa-vitest / qa-jest / qa-mocha / qa-cucumberjs / qa-cypress / qa-playwright / qa-wdio).
 */
export declare function renderGithubUpload(ctx: CiTemplateContext): CiTemplateResult;
