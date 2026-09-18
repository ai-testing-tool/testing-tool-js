/**
 * Cross-environment bridge for Jest qa helpers ↔ reporter.
 *
 * Jest jsdom (and other custom environments) use a separate `globalThis` from the
 * reporter's Node context. Node's `process` is the same object in both, so we
 * park the bridge there when `--runInBand` (required for helpers).
 */
import type { QaJestBridge } from './jest';
export declare function getQaJestBridge(): QaJestBridge | undefined;
export declare function setQaJestBridge(bridge: QaJestBridge): void;
export declare function clearQaJestBridge(): void;
