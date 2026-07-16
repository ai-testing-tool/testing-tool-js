import { ModeEnum, QAnalyzerReporter, type OptionsType } from '@qanalyzer/forge-commons';

import { publishBufferedResults } from './publish';

/**
 * Tracks onPrepare/onComplete hook pairing (FR123 / NFR33).
 */
export const hooksLifecycle = {
  beforeCalled: false,
  afterCalled: false,

  reset(): void {
    this.beforeCalled = false;
    this.afterCalled = false;
  },
};

function isOff(mode: unknown): boolean {
  return mode === ModeEnum.off || mode === 'off' || mode == null;
}

/**
 * Call from `wdio.conf.js` `onPrepare`.
 * Initializes commons reporter config (default mode=off).
 */
export async function beforeRunHook(options: OptionsType = {}): Promise<void> {
  hooksLifecycle.beforeCalled = true;
  QAnalyzerReporter.getInstance(options);
}

/**
 * Call from `wdio.conf.js` `onComplete`.
 * Publishes buffered FR41 results when mode is ingest|file (with onRunnerEnd).
 */
export async function afterRunHook(): Promise<void> {
  hooksLifecycle.afterCalled = true;
  try {
    await publishBufferedResults();
  } catch {
    // Never fail the WDIO run
  }
}

/**
 * Fail fast when ingest/file mode runs without hooks (NFR33).
 */
export function assertHooksForMode(mode: unknown, debug = false): void {
  if (isOff(mode)) return;
  if (hooksLifecycle.beforeCalled && hooksLifecycle.afterCalled) return;

  // Allow publish from onRunnerEnd before onComplete — only error if before never ran.
  if (hooksLifecycle.beforeCalled) return;

  const message =
    '@qanalyzer/forge-wdio requires onPrepare → beforeRunHook() and onComplete → afterRunHook() when QANALYZER_MODE is ingest or file (NFR33)';

  if (debug) {
    throw new Error(message);
  }
  // eslint-disable-next-line no-console
  console.error(`[@qanalyzer/forge-wdio] ${message}`);
}
