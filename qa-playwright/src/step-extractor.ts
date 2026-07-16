import type { QaMetaStepWire } from '@qanalyzer/forge-commons';

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
export function extractNativeSteps(
  steps: readonly PlaywrightStepLike[] | undefined,
): QaMetaStepWire[] {
  const out: QaMetaStepWire[] = [];
  let index = 0;

  const walk = (list: readonly PlaywrightStepLike[] | undefined): void => {
    if (!list) return;
    for (const step of list) {
      if (step.category !== 'test.step') {
        walk(step.steps);
        continue;
      }
      index += 1;
      out.push({
        id: `s${index}`,
        stepType: 'text',
        name: step.title,
        status: step.error ? 'failed' : 'passed',
      });
      walk(step.steps);
    }
  };

  walk(steps);
  return out;
}
