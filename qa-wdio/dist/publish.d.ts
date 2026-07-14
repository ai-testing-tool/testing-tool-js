/**
 * Publish buffered specs via commons (idempotent).
 * Called from `onRunnerEnd` and `afterRunHook` (FR123).
 * Merges FR133 failure screenshots before publish.
 */
export declare function publishBufferedResults(): Promise<void>;
