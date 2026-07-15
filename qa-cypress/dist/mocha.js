"use strict";
/**
 * Programmatic helpers for Cypress Mocha specs (FR63–FR64).
 * Prefer Jira issue keys in `it('AUTH-101 ...')` titles (FR43).
 *
 * `qa.step()` accepts **synchronous** callbacks only (no async/await) —
 * Cypress command-queue safe.
 *
 * In the browser, helpers forward via `cy.task` (requires `qa-forge-cypress/metadata`).
 * Outside Cypress (unit tests), they use an in-process buffer.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetadataManager = exports.qa = void 0;
const metadata_manager_1 = require("./metadata-manager");
Object.defineProperty(exports, "MetadataManager", { enumerable: true, get: function () { return metadata_manager_1.MetadataManager; } });
function cyRef() {
    const g = globalThis;
    return g.cy;
}
function isThenable(value) {
    return (value !== null &&
        typeof value === 'object' &&
        typeof value.then === 'function');
}
function pushLocal(type, body) {
    metadata_manager_1.MetadataManager.push(type, body);
}
function pushTask(taskName, body) {
    return cyRef().task(taskName, body);
}
exports.qa = {
    title(value) {
        const cy = cyRef();
        if (cy) {
            pushTask('qaTitle', value);
            return;
        }
        pushLocal('qa-title', value);
    },
    comment(value) {
        const cy = cyRef();
        if (cy) {
            pushTask('qaComment', value);
            return;
        }
        pushLocal('qa-comment', value);
    },
    suite(value) {
        const cy = cyRef();
        if (cy) {
            pushTask('qaSuite', value);
            return;
        }
        pushLocal('qa-suite', value);
    },
    parameters(values) {
        const cy = cyRef();
        if (cy) {
            pushTask('qaParameters', values);
            return;
        }
        pushLocal('qa-parameters', values);
    },
    ignore() {
        const cy = cyRef();
        if (cy) {
            pushTask('qaIgnore');
            return;
        }
        pushLocal('qa-ignore', true);
    },
    step(name, body) {
        const cy = cyRef();
        if (cy) {
            pushTask('qaStepStart', name)
                .then(() => {
                const result = body();
                if (isThenable(result)) {
                    throw new Error('qa.step() requires a synchronous callback (no async/await) — FR64');
                }
            })
                .then(() => {
                pushTask('qaStepEnd', { name, status: 'passed' });
            });
            return;
        }
        pushLocal('qa-step', name);
        try {
            const result = body();
            if (isThenable(result)) {
                throw new Error('qa.step() requires a synchronous callback (no async/await) — FR64');
            }
            pushLocal('qa-step-end', { name, status: 'passed' });
        }
        catch (error) {
            pushLocal('qa-step-failed', { name, status: 'failed' });
            throw error;
        }
    },
};
