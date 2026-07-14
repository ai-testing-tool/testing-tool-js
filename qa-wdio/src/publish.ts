import {
  ModeEnum,
  QAnalyzerReporter,
} from 'qa-javascript-commons';

import { enrichSpecsWithFailureScreenshots } from './enrich-screenshots';
import { FailureScreenshotBuffer } from './failure-screenshot-buffer';
import { assertHooksForMode } from './hooks';
import { toJestJsonReport } from './report-builder';
import { ResultsBuffer } from './results-buffer';

/**
 * Publish buffered specs via commons (idempotent).
 * Called from `onRunnerEnd` and `afterRunHook` (FR123).
 * Merges FR133 failure screenshots before publish.
 */
export async function publishBufferedResults(): Promise<void> {
  if (ResultsBuffer.published) return;

  const options = ResultsBuffer.options;
  const mode = String(options.mode ?? ModeEnum.off);
  assertHooksForMode(mode, Boolean(options.debug));

  if (mode === 'off') {
    ResultsBuffer.published = true;
    ResultsBuffer.takeSpecs();
    FailureScreenshotBuffer.clear();
    return;
  }

  const specs = ResultsBuffer.takeSpecs();
  ResultsBuffer.published = true;
  if (specs.length === 0) {
    FailureScreenshotBuffer.clear();
    return;
  }

  try {
    enrichSpecsWithFailureScreenshots(specs);
  } catch {
    // Never fail the WDIO run because of attach errors
  }

  QAnalyzerReporter.resetInstance();
  const reporter = QAnalyzerReporter.getInstance({
    ...options,
    mode: options.mode ?? ModeEnum.off,
    frameworkPackage: options.frameworkPackage ?? '@wdio/cli',
    frameworkName: options.frameworkName ?? 'wdio',
    reporterName: options.reporterName ?? 'qa-wdio',
  });

  const report = toJestJsonReport(specs, ResultsBuffer.runStart);
  await reporter.publishReport(report, {
    format: 'jest-json',
    launchName: options.launchName,
    projectKey: options.projectKey,
  });
  FailureScreenshotBuffer.clear();
}
