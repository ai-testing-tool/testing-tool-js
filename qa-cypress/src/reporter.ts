import { reporters, Runner, type MochaOptions, type Test } from 'mocha';
import {
  ModeEnum,
  qaMetaFromEntries,
  type OptionsType,
} from 'qa-forge-commons';

import { MetadataManager } from './metadata-manager';
import type { CypressAssertionInput, CypressSpecInput } from './report-builder';
import { ResultsManager } from './results-manager';

export type CypressQaOptions = OptionsType & {
  /** Override results bridge path (also QANALYZER_CYPRESS_RESULTS_PATH). */
  resultsPath?: string;
};

export type CypressQaReporterOptions = Omit<MochaOptions, 'reporterOptions'> & {
  reporterOptions?: CypressQaOptions;
};

type MochaState = 'failed' | 'passed' | 'pending';

function mapStatus(state: MochaState | undefined): CypressAssertionInput['status'] {
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
 * Cypress Mocha reporter for QAnalyzer.
 *
 * Collects per-`it()` results + `qa.*` metadata, appends to ResultsManager.
 * Plugin `after:run` publishes FR41 (mode=ingest|file). mode=off no-ops.
 */
export class CypressQaReporter extends reporters.Base {
  private readonly options: CypressQaOptions;
  private readonly byFile = new Map<string, CypressAssertionInput[]>();
  private readonly runStart = Date.now();

  constructor(runner: Runner, options: CypressQaReporterOptions = {}) {
    super(runner, options as MochaOptions);
    this.options = options.reporterOptions ?? {};

    if (this.options.resultsPath) {
      process.env.QANALYZER_CYPRESS_RESULTS_PATH = this.options.resultsPath;
    }

    runner.on(Runner.constants.EVENT_TEST_BEGIN, () => {
      MetadataManager.clear();
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
      this.flushToResultsManager();
    });
  }

  private record(test: Test, state: MochaState): void {
    try {
      const entries = MetadataManager.getEntries();
      const wire = qaMetaFromEntries(entries, {
        framework: 'cypress',
        reporter: 'qa-forge-cypress',
      });
      MetadataManager.clear();

      const ancestors = ancestorTitles(test);
      const assertion: CypressAssertionInput = {
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
      // Never fail the Cypress run
    }
  }

  private flushToResultsManager(): void {
    try {
      const mode = this.options.mode ?? ModeEnum.off;
      // Always buffer when not off so after:run can publish; also buffer when
      // off so local debugging of the bridge still works without publish.
      const path = ResultsManager.resolvePath(this.options.resultsPath);
      for (const [name, assertions] of this.byFile) {
        if (assertions.length === 0) continue;
        const spec: CypressSpecInput = {
          name,
          startTime: this.runStart,
          endTime: Date.now(),
          assertions,
        };
        ResultsManager.appendSpec(spec, path);
      }
      this.byFile.clear();

      // Hint for logs / tests — actual publish is plugin after:run
      void mode;
    } catch {
      // Never fail the Cypress run
    }
  }
}

export default CypressQaReporter;
