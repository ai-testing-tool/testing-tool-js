import type {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
  TestResult,
  TestStep,
} from '@playwright/test/reporter';
import {
  ModeEnum,
  QAnalyzerReporter,
  type OptionsType,
} from 'qa-forge-commons';

import { enrichAssertionWithFailureScreenshots } from './enrich-screenshots';
import { buildQaMetaFromResult } from './metadata-from-result';
import {
  mapPlaywrightStatus,
  toJestJsonReport,
  type PlaywrightAssertionInput,
  type PlaywrightSpecInput,
} from './report-builder';

export type PlaywrightQaOptions = OptionsType;

/**
 * Playwright reporter for QAnalyzer.
 *
 * Configure:
 *   reporter: [['list'], ['qa-forge-playwright', { mode: 'off' }]]
 *
 * Collects each test → FR41 shape A; native `test.step` → `meta.qa.steps`.
 * On failure, still-image attachments are uploaded via Forge (FR119).
 */
export class PlaywrightQaReporter implements Reporter {
  private readonly options: PlaywrightQaOptions;
  private readonly byFile = new Map<string, PlaywrightAssertionInput[]>();
  private readonly runStart = Date.now();
  private readonly pendingUploads: Promise<void>[] = [];
  private publishPromise: Promise<void> | null = null;

  constructor(options: PlaywrightQaOptions = {}) {
    this.options = options ?? {};
  }

  onBegin(_config: FullConfig, _suite: Suite): void {
    this.byFile.clear();
    this.pendingUploads.length = 0;
  }

  onStepBegin(_test: TestCase, _result: TestResult, _step: TestStep): void {
    // Steps are read from result.steps on onTestEnd (full tree available there)
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    try {
      const pathTitles =
        typeof test.titlePath === 'function' ? test.titlePath() : [test.title];
      const ancestorTitles = pathTitles.slice(0, -1);
      const title = test.title;
      const fullName =
        ancestorTitles.length > 0
          ? `${ancestorTitles.join(' ')} ${title}`
          : title;

      const wire = buildQaMetaFromResult({
        attachments: result.attachments,
        steps: result.steps,
      });

      const failureMessages = (result.errors ?? [])
        .map((e) => {
          if (typeof e === 'string') return e;
          if (e && typeof e === 'object' && 'message' in e) {
            return String((e as { message?: unknown }).message ?? '');
          }
          return String(e);
        })
        .filter(Boolean);

      const assertion: PlaywrightAssertionInput = {
        ancestorTitles,
        title,
        fullName,
        status: mapPlaywrightStatus(result.status),
        duration: result.duration,
        failureMessages,
      };
      if (wire) {
        assertion.meta = { qa: wire };
      }

      const file =
        test.location?.file ??
        (test as TestCase & { file?: string }).file ??
        'unknown';
      const list = this.byFile.get(file) ?? [];
      list.push(assertion);
      this.byFile.set(file, list);

      if (assertion.status === 'failed') {
        this.pendingUploads.push(
          enrichAssertionWithFailureScreenshots(
            assertion,
            result.attachments as never,
          ).catch(() => {
            // Never fail the Playwright run
          }),
        );
      }
    } catch {
      // Never fail the Playwright run
    }
  }

  async onEnd(_result: FullResult): Promise<void> {
    if (this.publishPromise) {
      await this.publishPromise;
      return;
    }
    this.publishPromise = this.publish();
    await this.publishPromise;
  }

  private async publish(): Promise<void> {
    try {
      await Promise.all(this.pendingUploads);

      QAnalyzerReporter.resetInstance();
      const reporter = QAnalyzerReporter.getInstance({
        ...this.options,
        mode: this.options.mode ?? ModeEnum.off,
      });

      const mode = reporter.getConfig().mode ?? ModeEnum.off;
      if (mode === ModeEnum.off) {
        this.byFile.clear();
        return;
      }

      const specs: PlaywrightSpecInput[] = [];
      for (const [name, assertions] of this.byFile) {
        if (assertions.length === 0) continue;
        specs.push({
          name,
          startTime: this.runStart,
          endTime: Date.now(),
          assertions,
        });
      }
      this.byFile.clear();

      if (specs.length === 0) return;

      const report = toJestJsonReport(specs, this.runStart);
      await reporter.publishReport(report, {
        format: 'jest-json',
        launchName: this.options.launchName,
        projectKey: this.options.projectKey,
      });
    } catch {
      // Never fail the Playwright run because of reporter publish errors
    }
  }
}

export default PlaywrightQaReporter;
