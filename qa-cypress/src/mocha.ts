/**
 * Programmatic helpers for Cypress Mocha specs (FR63–FR64).
 * Prefer Jira issue keys in `it('AUTH-101 ...')` titles (FR43).
 *
 * `qa.step()` accepts **synchronous** callbacks only (no async/await) —
 * Cypress command-queue safe.
 *
 * In the browser, helpers forward via `cy.task` (requires `qa-cypress/metadata`).
 * Outside Cypress (unit tests), they use an in-process buffer.
 */

import { MetadataManager } from './metadata-manager';

type SyncStepFn = () => void;

export type QaHelpers = {
  title(value: string): void;
  comment(value: string): void;
  suite(value: string): void;
  parameters(values: Record<string, string>): void;
  ignore(): void;
  /** Sync callback only (FR64). */
  step(name: string, body: SyncStepFn): void;
};

type CypressChain = {
  then: (fn: () => unknown) => CypressChain;
};

type CypressLike = {
  task: (name: string, value?: unknown) => CypressChain;
};

function cyRef(): CypressLike | undefined {
  const g = globalThis as { cy?: CypressLike };
  return g.cy;
}

function isThenable(value: unknown): boolean {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof (value as { then?: unknown }).then === 'function'
  );
}

function pushLocal(type: string, body: unknown): void {
  MetadataManager.push(type, body);
}

function pushTask(taskName: string, body?: unknown): CypressChain {
  return cyRef()!.task(taskName, body);
}

export const qa: QaHelpers = {
  title(value: string) {
    const cy = cyRef();
    if (cy) {
      pushTask('qaTitle', value);
      return;
    }
    pushLocal('qa-title', value);
  },
  comment(value: string) {
    const cy = cyRef();
    if (cy) {
      pushTask('qaComment', value);
      return;
    }
    pushLocal('qa-comment', value);
  },
  suite(value: string) {
    const cy = cyRef();
    if (cy) {
      pushTask('qaSuite', value);
      return;
    }
    pushLocal('qa-suite', value);
  },
  parameters(values: Record<string, string>) {
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
  step(name: string, body: SyncStepFn) {
    const cy = cyRef();
    if (cy) {
      pushTask('qaStepStart', name)
        .then(() => {
          const result = body() as unknown;
          if (isThenable(result)) {
            throw new Error(
              'qa.step() requires a synchronous callback (no async/await) — FR64',
            );
          }
        })
        .then(() => {
          pushTask('qaStepEnd', { name, status: 'passed' });
        });
      return;
    }

    pushLocal('qa-step', name);
    try {
      const result = body() as unknown;
      if (isThenable(result)) {
        throw new Error(
          'qa.step() requires a synchronous callback (no async/await) — FR64',
        );
      }
      pushLocal('qa-step-end', { name, status: 'passed' });
    } catch (error) {
      pushLocal('qa-step-failed', { name, status: 'failed' });
      throw error;
    }
  },
};

export { MetadataManager };
export type { QaMetaEntry } from './metadata-manager';
