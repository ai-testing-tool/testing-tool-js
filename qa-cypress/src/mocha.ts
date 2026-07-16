/**
 * Programmatic helpers for Cypress Mocha specs (FR63–FR64).
 * Prefer `qa.issueKey()` / `qa.issueKeys()` for FR43 (title keys remain a fallback).
 *
 * `qa.step()` accepts **synchronous** callbacks only (no async/await) —
 * Cypress command-queue safe.
 *
 * In the browser, helpers forward via `cy.task` (requires `@qanalyzer/forge-cypress/metadata`).
 * Outside Cypress (unit tests), they use an in-process buffer.
 */

import { MetadataManager } from './metadata-manager';

type SyncStepFn = () => void;

export type QaHelpers = {
  title(value: string): void;
  comment(value: string): void;
  suite(value: string): void;
  parameters(values: Record<string, string>): void;
  /** Explicit FR43 issue key (preferred over embedding in titles). */
  issueKey(key: string): void;
  /** Explicit FR43 issue keys (preferred over embedding in titles). */
  issueKeys(keys: string[]): void;
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
  issueKey(key: string) {
    const cy = cyRef();
    if (cy) {
      pushTask('qaIssueKey', key);
      return;
    }
    pushLocal('qa-issue-key', key);
  },
  issueKeys(keys: string[]) {
    const cy = cyRef();
    if (cy) {
      pushTask('qaIssueKeys', keys);
      return;
    }
    pushLocal('qa-issue-keys', keys);
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
