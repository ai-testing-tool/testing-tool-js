import { reporters, Runner, type MochaOptions, type Test } from 'mocha';
import {
  ModeEnum,
  QAnalyzerReporter,
  qaMetaFromEntries,
  type OptionsType,
} from '@qanalyzer/forge-commons';

import type { QaMochaBridge, QaMetaEntry } from './mocha';
import {
  toJestJsonReport,
  type MochaAssertionInput,
  type MochaSpecInput,
} from './report-builder';

export type MochaQaOptions = OptionsType;

export type MochaQaReporterOptions = Omit<MochaOptions, 'reporterOptions'> & {
  reporterOptions?: MochaQaOptions;
};

type MochaState = 'failed' | 'passed' | 'pending';

function mapStatus(state: MochaState | undefined): MochaAssertionInput['status'] {
  if (state === 'failed') return 'failed';
  if (state === 'pending') return 'pending';
  return 'passed';
}

function ancestorTitles(test: Test): string[] {
  try {
    const path = typeof test.titlePath === 'function' ? test.titlePath() : [];
    if (path.length > 1) return path.slice(0, -1);
  } catch {
    // fall through
  }
  const titles: string[] = [];
  let parent = test.parent;
  while (parent && !parent.root) {
    if (parent.title) titles.unshift(parent.title);
    parent = parent.parent;
  }
  return titles;
}

function specFileName(test: Test): string {
  const fromTest = (test as Test & { file?: string }).file;
  if (fromTest) return fromTest;
  let parent = test.parent;
  while (parent) {
    const file = (parent as { file?: string }).file;
    if (file) return file;
    parent = parent.parent;
  }
  return 'unknown';
}

function failureMessages(test: Test): string[] {
  const err = test.err as { message?: string; stack?: string } | undefined;
  if (!err) return [];
  const msg = err.stack || err.message;
  return msg ? [msg] : [];
}

/**
 * Mocha custom reporter for QAnalyzer.
 *
 * Configure: `.mocharc.js` → `reporter: '@qanalyzer/forge-mocha'`
 * Options: `reporterOptions: { mode: 'ingest' | 'file' | 'off', … }`
 * Env: `QANALYZER_MODE`, `QANALYZER_PROJECT_KEY`, …
 *
 * Helpers from `@qanalyzer/forge-mocha/mocha` forward metadata via a global bridge.
 */
export class MochaQaReporter extends reporters.Spec {
  private readonly options: MochaQaOptions;
  private readonly bridgeBuffer: QaMetaEntry[] = [];
  private readonly byFile = new Map<string, MochaAssertionInput[]>();
  private readonly runStart = Date.now();
  private publishPromise: Promise<void> | null = null;

  constructor(runner: Runner, options: MochaQaReporterOptions = {}) {
    super(runner, options as MochaOptions);
    this.options = options.reporterOptions ?? {};
    this.installBridge();

    runner.on(Runner.constants.EVENT_TEST_BEGIN, (test: Test) => {
      this.bridgeBuffer.length = 0;
      if (globalThis.__QA_MOCHA_BRIDGE__) {
        globalThis.__QA_MOCHA_BRIDGE__.currentTitle = test.fullTitle?.() ?? test.title;
      }
    });

    runner.on(Runner.constants.EVENT_TEST_PASS, (test: Test) => {
      this.record(test, 'passed');
    });
    runner.on(Runner.constants.EVENT_TEST_FAIL, (test: Test) => {
      this.record(test, 'failed');
    });
    runner.on(Runner.constants.EVENT_TEST_PENDING, (test: Test) => {
      this.record(test, 'pending');
    });

    runner.once(Runner.constants.EVENT_RUN_END, () => {
      this.publishPromise = this.publish();
      void this.publishPromise.catch(() => {
        // Never fail the Mocha run because of reporter publish errors
      });
    });
  }

  /** Await in-process publish (tests / programmatic runs). */
  async waitForPublish(): Promise<void> {
    if (this.publishPromise) await this.publishPromise;
  }

  private installBridge(): void {
    const bridge: QaMochaBridge = {
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
    globalThis.__QA_MOCHA_BRIDGE__ = bridge;
  }

  private record(test: Test, state: MochaState): void {
    try {
      const entries = this.bridgeBuffer.splice(0, this.bridgeBuffer.length);
      const wire = qaMetaFromEntries(entries, {
        framework: 'mocha',
        reporter: '@qanalyzer/forge-mocha',
      });

      const ancestors = ancestorTitles(test);
      const assertion: MochaAssertionInput = {
        ancestorTitles: ancestors,
        title: test.title,
        fullName:
          ancestors.length > 0 ? `${ancestors.join(' ')} ${test.title}` : test.title,
        status: mapStatus(state ?? (test.state as MochaState | undefined)),
        duration: test.duration ?? undefined,
        failureMessages: state === 'failed' ? failureMessages(test) : [],
      };
      if (wire) {
        assertion.meta = { qa: wire };
      }

      const file = specFileName(test);
      const list = this.byFile.get(file) ?? [];
      list.push(assertion);
      this.byFile.set(file, list);
    } catch {
      // Never fail the Mocha run
    }
  }

  private async publish(): Promise<void> {
    try {
      QAnalyzerReporter.resetInstance();
      const reporter = QAnalyzerReporter.getInstance({
        ...this.options,
        mode: this.options.mode ?? ModeEnum.off,
        frameworkName: this.options.frameworkName ?? 'mocha',
        reporterName: this.options.reporterName ?? '@qanalyzer/forge-mocha',
        frameworkPackage: this.options.frameworkPackage ?? 'mocha',
      });

      const mode = reporter.getConfig().mode ?? ModeEnum.off;
      if (mode === ModeEnum.off) {
        this.byFile.clear();
        return;
      }

      const specs: MochaSpecInput[] = [];
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

      const report = toJestJsonReport(specs, this.runStart);
      await reporter.publishReport(report, {
        format: 'jest-json',
        launchName: this.options.launchName,
        projectKey: this.options.projectKey,
      });
    } catch {
      // Never fail the Mocha run because of reporter publish errors
    }
  }
}
