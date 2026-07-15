import {
  ModeEnum,
  QAnalyzerReporter,
  qaMetaFromEntries,
  type OptionsType,
  type QaMetaWire,
} from 'qa-forge-commons';

import type { QaJestBridge, QaMetaEntry } from './jest';
import { toJestJsonReport, type AggregatedResultLike } from './report-builder';

export type JestQaOptions = OptionsType;

type JestTestCaseResultLike = {
  fullName?: string;
  title?: string;
};

/**
 * Jest custom reporter for QAnalyzer.
 * Configure: `reporters: ['default', 'qa-forge-jest']` or `['qa-forge-jest', { mode: 'ingest', ... }]`.
 *
 * Helpers from `qa-forge-jest/jest` forward metadata via a global bridge (works with `--runInBand`).
 */
export class JestQaReporter {
  private readonly options: JestQaOptions;
  private publishPromise: Promise<void> | null = null;
  private readonly bridgeBuffer: QaMetaEntry[] = [];
  private readonly metaByFullName = new Map<string, QaMetaWire>();

  constructor(_globalConfig: unknown, options: JestQaOptions = {}) {
    this.options = options ?? {};
    this.installBridge();
  }

  private installBridge(): void {
    const bridge: QaJestBridge = {
      push: (entry) => {
        this.bridgeBuffer.push(entry);
      },
      drain: () => {
        const copy = [...this.bridgeBuffer];
        this.bridgeBuffer.length = 0;
        return copy;
      },
      currentTitle: undefined,
    };
    globalThis.__QA_JEST_BRIDGE__ = bridge;
  }

  onTestCaseStart(
    _test: unknown,
    testCaseStartInfo: JestTestCaseResultLike,
  ): void {
    try {
      if (globalThis.__QA_JEST_BRIDGE__) {
        globalThis.__QA_JEST_BRIDGE__.currentTitle =
          testCaseStartInfo.fullName ?? testCaseStartInfo.title;
      }
    } catch {
      // never fail
    }
  }

  onTestCaseResult(_test: unknown, testCaseResult: JestTestCaseResultLike): void {
    try {
      const entries = this.bridgeBuffer.splice(0, this.bridgeBuffer.length);
      const wire = qaMetaFromEntries(entries, { framework: 'jest' });
      const key = testCaseResult.fullName ?? testCaseResult.title;
      if (wire && key) {
        this.metaByFullName.set(key, wire);
      }
    } catch {
      // Never fail the Jest run because of metadata collection
    }
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

      // Jest finalizes aggregatedResults.success *after* dispatching onRunComplete
      // (it folds in reporter errors), so reporters always see a stale `false`.
      // Drop it and let the builder derive success from failure counts.
      const report = toJestJsonReport(
        { ...results, success: undefined },
        this.metaByFullName,
      );
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
