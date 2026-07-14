"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractNativeSteps = extractNativeSteps;
/**
 * Flatten native Playwright `test.step` hierarchy into FR41 `meta.qa.steps` (FR112 / NFR31).
 * Skips hooks and non-`test.step` categories.
 */
function extractNativeSteps(steps) {
    const out = [];
    let index = 0;
    const walk = (list) => {
        if (!list)
            return;
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
