import { Formatter, type IFormatterOptions } from '@cucumber/cucumber';
import type { Envelope } from '@cucumber/messages';
import {
  ModeEnum,
  QAnalyzerReporter,
  type OptionsType,
} from 'qa-forge-commons';

import { EventStorage } from './modules/event-storage';
import {
  scenarioToAssertionAsync,
  specsFromAssertions,
  toJestJsonReport,
  type CucumberAssertionInput,
} from './report-builder';

export type CucumberQaOptions = OptionsType;

export type CucumberQaFormatterOptions = IFormatterOptions & CucumberQaOptions;

/**
 * CucumberJS custom formatter for QAnalyzer.
 *
 * Configure (`cucumber.js`):
 *   format: ['progress', 'qa-forge-cucumberjs']
 *
 * Modes via env (`QANALYZER_MODE`) or formatOptions.
 * Helpers are tag-based (`@QaTitle`, `@QaSuite`, `@QaIgnore`, `@AUTH-101`) — no programmatic import (FR54).
 * `this.attach()` → envelope.attachment → optional Forge upload (FR58).
 */
export class CucumberQaFormatter extends Formatter {
  private readonly options: CucumberQaOptions;
  private readonly storage = new EventStorage();
  private readonly byUri = new Map<string, CucumberAssertionInput[]>();
  private readonly runStart = Date.now();
  private readonly pendingScenarios: Promise<void>[] = [];
  private publishPromise: Promise<void> | null = null;

  constructor(options: CucumberQaFormatterOptions) {
    const {
      mode,
      projectKey,
      debug,
      launchName,
      frameworkPackage,
      frameworkName,
      reporterName,
      fallback,
      file,
      ...formatterOptions
    } = options;

    super(formatterOptions);

    this.options = {
      mode,
      projectKey,
      debug,
      launchName,
      file,
      frameworkPackage: frameworkPackage ?? '@cucumber/cucumber',
      frameworkName: frameworkName ?? 'cucumberjs',
      reporterName: reporterName ?? 'qa-forge-cucumberjs',
      fallback,
    };

    options.eventBroadcaster.on('envelope', (envelope: Envelope) => {
      this.onEnvelope(envelope);
    });
  }

  async waitForPublish(): Promise<void> {
    if (this.publishPromise) await this.publishPromise;
  }

  private onEnvelope(envelope: Envelope): void {
    try {
      if (envelope.testCaseFinished) {
        const converted = this.storage.convertFinished(envelope.testCaseFinished);
        if (converted) {
          this.pendingScenarios.push(
            scenarioToAssertionAsync(converted)
              .then((assertion) => {
                if (!assertion) return;
                const list = this.byUri.get(converted.uri) ?? [];
                list.push(assertion);
                this.byUri.set(converted.uri, list);
              })
              .catch(() => {
                // Never fail the Cucumber run
              }),
          );
        }
      } else {
        this.storage.ingest(envelope);
      }

      if (envelope.testRunFinished) {
        this.publishPromise = this.publish();
        void this.publishPromise.catch(() => {
          // Never fail the Cucumber run
        });
      }
    } catch {
      // Never fail the Cucumber run
    }
  }

  private async publish(): Promise<void> {
    try {
      await Promise.all(this.pendingScenarios);

      QAnalyzerReporter.resetInstance();
      const reporter = QAnalyzerReporter.getInstance({
        ...this.options,
        mode: this.options.mode ?? ModeEnum.off,
      });

      const mode = reporter.getConfig().mode ?? ModeEnum.off;
      if (mode === ModeEnum.off) {
        this.byUri.clear();
        return;
      }

      const specs = specsFromAssertions(this.byUri, this.runStart, Date.now());
      this.byUri.clear();

      const report = toJestJsonReport(specs, this.runStart);
      await reporter.publishReport(report, {
        format: 'jest-json',
        launchName: this.options.launchName,
        projectKey: this.options.projectKey,
      });
    } catch {
      // Never fail the Cucumber run
    }
  }
}
