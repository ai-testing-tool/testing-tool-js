import { type OptionsType } from '@ai-testing-tool/forge-commons';
/**
 * Tracks onPrepare/onComplete hook pairing (FR123 / NFR33).
 */
export declare const hooksLifecycle: {
    beforeCalled: boolean;
    afterCalled: boolean;
    reset(): void;
};
/**
 * Call from `wdio.conf.js` `onPrepare`.
 * Initializes commons reporter config (default mode=off).
 */
export declare function beforeRunHook(options?: OptionsType): Promise<void>;
/**
 * Call from `wdio.conf.js` `onComplete`.
 * Publishes buffered FR41 results when mode is ingest|file (with onRunnerEnd).
 */
export declare function afterRunHook(): Promise<void>;
/**
 * Fail fast when ingest/file mode runs without hooks (NFR33).
 */
export declare function assertHooksForMode(mode: unknown, debug?: boolean): void;
