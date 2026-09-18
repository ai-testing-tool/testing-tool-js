/**
 * Cross-environment bridge for Jest qa helpers ↔ reporter.
 *
 * Jest jsdom (and other custom environments) use a separate `globalThis` from the
 * reporter's Node context. Node's `process` is the same object in both, so we
 * park the bridge there when `--runInBand` (required for helpers).
 */

import type { QaJestBridge } from './jest';

const PROCESS_KEY = '__QA_JEST_BRIDGE__' as const;

type ProcessWithBridge = NodeJS.Process & {
  [PROCESS_KEY]?: QaJestBridge;
};

function processSlot(): ProcessWithBridge | undefined {
  try {
    return typeof process !== 'undefined' ? (process as ProcessWithBridge) : undefined;
  } catch {
    return undefined;
  }
}

export function getQaJestBridge(): QaJestBridge | undefined {
  return processSlot()?.[PROCESS_KEY] ?? globalThis.__QA_JEST_BRIDGE__;
}

export function setQaJestBridge(bridge: QaJestBridge): void {
  const proc = processSlot();
  if (proc) {
    proc[PROCESS_KEY] = bridge;
  }
  globalThis.__QA_JEST_BRIDGE__ = bridge;
}

export function clearQaJestBridge(): void {
  const proc = processSlot();
  if (proc) {
    delete proc[PROCESS_KEY];
  }
  try {
    delete globalThis.__QA_JEST_BRIDGE__;
  } catch {
    globalThis.__QA_JEST_BRIDGE__ = undefined;
  }
}
