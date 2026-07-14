import type { CypressSpecInput } from './report-builder';
/**
 * For each failed assertion, upload a matching still-image screenshot if available.
 * Each screenshot is consumed at most once.
 */
export declare function enrichSpecsWithFailureScreenshots(specs: CypressSpecInput[], screenshotsPath?: string): Promise<void>;
