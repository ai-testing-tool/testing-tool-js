import {
  ModeEnum,
  QAnalyzerReporter,
  type OptionsType,
} from 'qa-javascript-commons';

import { toJestJsonReport, type AggregatedResultLike } from './report-builder';

export type JestQaOptions = OptionsType;

/**
 * Jest custom reporter for QAnalyzer.
 * Configure: `reporters: ['default', 'qa-jest']` or `['qa-jest', { mode: 'ingest', ... }]`.
 */
export class JestQaReporter {
  private readonly options: JestQaOptions;
  private publishPromise: Promise<void> | null = null;

  constructor(_globalConfig: unknown, options: JestQaOptions = {}) {
    this.options = options ?? {};
  }

  async onRunComplete(
    _testContexts: unknown,
    results: AggregatedResultLike,
  ): Promise<void> {
    if (this.publishPromise) {
      await this.publishPromise;
      return;
    }

    this.publishPromise = this.publish(results);
    await this.publishPromise;
  }

  private async publish(results: AggregatedResultLike): Promise<void> {
    try {
      QAnalyzerReporter.resetInstance();
      const reporter = QAnalyzerReporter.getInstance({
        ...this.options,
        mode: this.options.mode ?? ModeEnum.off,
      });

      const mode = reporter.getConfig().mode ?? ModeEnum.off;
      if (mode === ModeEnum.off) {
        return;
      }

      const report = toJestJsonReport(results);
      await reporter.publishReport(report, {
        format: 'jest-json',
        launchName: this.options.launchName,
        projectKey: this.options.projectKey,
      });
    } catch {
      // Never fail the Jest run because of reporter publish errors
    }
  }
}

export default JestQaReporter;
