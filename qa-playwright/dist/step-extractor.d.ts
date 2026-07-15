import type { QaMetaStepWire } from 'qa-forge-commons';
/** Minimal Playwright TestStep shape used by the extractor (avoids tight coupling in tests). */
export type PlaywrightStepLike = {
    category: string;
    title: string;
    error?: unknown;
    steps?: PlaywrightStepLike[];
};
/**
 * Flatten native Playwright `test.step` hierarchy into FR41 `meta.qa.steps` (FR112 / NFR31).
 * Skips hooks and non-`test.step` categories.
 */
export declare function extractNativeSteps(steps: readonly PlaywrightStepLike[] | undefined): QaMetaStepWire[];
