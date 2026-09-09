import type { Reporter } from 'vitest/reporters';
import type { TestCase } from 'vitest/node';
import {
  ModeEnum,
  AiTestingToolReporter,
  applyQaAnnotations,
  createQaMetaAccumulator,
  toQaMetaWire,
  type OptionsType,
} from '@ai-testing-tool/forge-commons';

import {
  buildJestCompatibleReport,
  groupCasesByFile,
  type CollectedCase,
} from './report-builder';

export type VitestQaOptions = OptionsType;

function mapState(state: string | undefined): CollectedCase['status'] {
  switch ((state ?? '').toLowerCase()) {
    case 'pass':
    case 'passed':
      return 'passed';
    case 'fail':
    case 'failed':
      return 'failed';
    case 'skip':
    case 'skipped':
      return 'skipped';
    case 'todo':
      return 'todo';
    case 'pending':
      return 'pending';
    default:
      return 'failed';
  }
}

function collectFromTestCase(testCase: TestCase): CollectedCase {
  const result = testCase.result();
  const diagnostic =
    typeof testCase.diagnostic === 'function' ? testCase.diagnostic() : null;
  const errors = result?.errors ?? [];
  const failureMessages = errors.map((err) => {
    if (!err) return 'Test failed';
    return err.stack ?? err.message ?? String(err);
  });

  const anyCase = testCase as unknown as {
    moduleId?: string;
    file?: { moduleId?: string };
    parent?: { name?: string; parent?: unknown };
  };

  const moduleId = anyCase.moduleId ?? anyCase.file?.moduleId ?? 'unknown';

  const ancestorTitles: string[] = [];
  try {
    let current: { name?: string; parent?: unknown } | undefined = anyCase.parent;
    const names: string[] = [];
    while (current?.name) {
      names.unshift(current.name);
      current = current.parent as { name?: string; parent?: unknown } | undefined;
    }
    ancestorTitles.push(...names);
  } catch {
    // ignore suite walk failures
  }

  const acc = createQaMetaAccumulator();
  try {
    const annotations =
      typeof testCase.annotations === 'function' ? testCase.annotations() : [];
    applyQaAnnotations(
      acc,
      annotations.map((a) => ({
        message: a.message,
        type: (a as { type?: string }).type,
        body: (a as { body?: unknown }).body,
      })),
    );
  } catch {
    // ignore annotation parse failures
  }

  const metaQa = toQaMetaWire(acc, { framework: 'vitest' });

  return {
    id: testCase.id,
    name: testCase.name,
    fullName: testCase.fullName || testCase.name,
    filePath: moduleId,
    ancestorTitles,
    status: mapState(result?.state),
    durationMs:
      diagnostic && typeof diagnostic.duration === 'number'
        ? Math.round(diagnostic.duration)
        : null,
    failureMessages,
    startTime: diagnostic?.startTime,
    metaQa,
  };
}

/**
 * Vitest custom reporter for AiTestingTool.
 * Configure: `reporters: ['default', '@ai-testing-tool/forge-vitest']` or `['@ai-testing-tool/forge-vitest', { mode: 'ingest', ... }]`.
 */
export class VitestQaReporter implements Reporter {
  private readonly options: VitestQaOptions;
  private readonly cases: CollectedCase[] = [];
  private readonly startedAt = Date.now();
  private publishPromise: Promise<void> | null = null;

  constructor(options: VitestQaOptions = {}) {
    this.options = options;
  }

  onTestCaseResult(testCase: TestCase): void {
    try {
      this.cases.push(collectFromTestCase(testCase));
    } catch {
      // Never fail the Vitest run because of reporter collection errors
    }
  }

  async onTestRunEnd(): Promise<void> {
    if (this.publishPromise) {
      await this.publishPromise;
      return;
    }

    this.publishPromise = this.publish();
    await this.publishPromise;
  }

  private async publish(): Promise<void> {
    AiTestingToolReporter.resetInstance();
    const reporter = AiTestingToolReporter.getInstance({
      ...this.options,
      mode: this.options.mode ?? ModeEnum.off,
    });

    const mode = reporter.getConfig().mode ?? ModeEnum.off;
    if (mode === ModeEnum.off) {
      return;
    }

    const report = buildJestCompatibleReport(groupCasesByFile(this.cases), {
      startTime: this.startedAt,
    });

    await reporter.publishReport(report, {
      format: 'vitest-json',
      launchName: this.options.launchName,
      projectKey: this.options.projectKey,
    });
  }
}

export default VitestQaReporter;
