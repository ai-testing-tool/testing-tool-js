import WDIOReporter from '@wdio/reporter';
import type { SuiteStats, TestStats } from '@wdio/reporter';
import {
  QAnalyzerReporter,
  qaMetaFromEntries,
  type OptionsType,
  type QaMetaWire,
} from 'qa-javascript-commons';

import { applyCucumberTags, type TagLike } from './cucumber-tags';
import { MetadataManager } from './metadata-manager';
import { publishBufferedResults } from './publish';
import {
  mapWdioStatus,
  type WdioAssertionInput,
} from './report-builder';
import { ResultsBuffer } from './results-buffer';

export type QaWdioReporterOptions = OptionsType & {
  /** Prefer programmatic `qa.step` over auto WebDriver commands (FR127). Default true. */
  disableWebdriverStepsReporting?: boolean;
  disableWebdriverScreenshotsReporting?: boolean;
  /** When true, treat suites as Cucumber scenarios and tests as Gherkin steps (FR135). */
  useCucumber?: boolean;
  outputDir?: string;
};

type SuiteTrail = { uid: string; title: string };

type CucumberStepState = {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  failureMessages: string[];
};

type CucumberScenarioState = {
  title: string;
  file: string;
  ancestors: string[];
  issueKeys: string[];
  steps: CucumberStepState[];
  currentStep?: string;
};

function ancestorTitles(
  test: TestStats,
  suiteStack: SuiteTrail[],
): string[] {
  if (suiteStack.length > 0) {
    return suiteStack.map((s) => s.title).filter((t) => t && t !== '(root)');
  }
  if (test.parent && test.parent !== '(root)') {
    return [test.parent];
  }
  return [];
}

function failureMessages(test: TestStats): string[] {
  const errors = test.errors ?? [];
  return errors
    .map((e) => {
      if (!e) return '';
      if (typeof e === 'string') return e;
      const err = e as { message?: string; stack?: string };
      return err.stack || err.message || String(e);
    })
    .filter(Boolean);
}

function suiteTags(suite: SuiteStats): TagLike[] {
  const tags = (suite as SuiteStats & { tags?: TagLike[] }).tags;
  return Array.isArray(tags) ? tags : [];
}

/**
 * WebdriverIO reporter for QAnalyzer.
 *
 * Configure:
 *   reporters: [[QaWdioReporter, { disableWebdriverStepsReporting: true }]]
 *   // Cucumber:
 *   reporters: [[QaWdioReporter, { useCucumber: true }]]
 *
 * Mocha: each `it()` → FR41 assertion; `qa.step` → `meta.qa.steps`.
 * Cucumber: each scenario suite → FR41 assertion; Gherkin steps → `meta.qa.steps` (FR135).
 */
export class QaWdioReporter extends WDIOReporter {
  private readonly qaOptions: OptionsType;
  readonly disableWebdriverStepsReporting: boolean;
  readonly disableWebdriverScreenshotsReporting: boolean;
  readonly useCucumber: boolean;
  private readonly suiteStack: SuiteTrail[] = [];
  private currentFile = 'unknown';
  private scenario: CucumberScenarioState | null = null;

  constructor(options: QaWdioReporterOptions = {}) {
    const {
      disableWebdriverStepsReporting = true,
      disableWebdriverScreenshotsReporting = true,
      useCucumber = false,
      outputDir,
      mode,
      projectKey,
      debug,
      launchName,
      frameworkPackage,
      frameworkName,
      reporterName,
      fallback,
      file,
      ...rest
    } = options;

    super({
      stdout: true,
      writeStream: process.stdout,
      outputDir,
      ...rest,
    } as ConstructorParameters<typeof WDIOReporter>[0]);

    this.disableWebdriverStepsReporting = disableWebdriverStepsReporting;
    this.disableWebdriverScreenshotsReporting =
      disableWebdriverScreenshotsReporting;
    this.useCucumber = useCucumber;
    this.qaOptions = {
      mode,
      projectKey,
      debug,
      launchName,
      file,
      frameworkPackage: frameworkPackage ?? '@wdio/cli',
      frameworkName: frameworkName ?? 'wdio',
      reporterName: reporterName ?? 'qa-wdio',
      fallback,
    };

    ResultsBuffer.reset(this.qaOptions);
    QAnalyzerReporter.getInstance(this.qaOptions);
  }

  override onSuiteStart(suite: SuiteStats): void {
    if (suite.file) {
      this.currentFile = suite.file;
    }

    if (this.useCucumber && suite.type === 'scenario') {
      MetadataManager.clear();
      const tagResult = applyCucumberTags(suiteTags(suite));
      this.scenario = {
        title: suite.title,
        file: suite.file || this.currentFile || 'unknown',
        ancestors: this.suiteStack
          .map((s) => s.title)
          .filter((t) => t && t !== '(root)'),
        issueKeys: tagResult.issueKeys,
        steps: [],
      };
      return;
    }

    this.suiteStack.push({ uid: suite.uid, title: suite.title });
  }

  override onSuiteEnd(suite: SuiteStats): void {
    if (this.useCucumber && suite.type === 'scenario') {
      this.finalizeCucumberScenario(suite);
      return;
    }

    const idx = [...this.suiteStack]
      .reverse()
      .findIndex((s) => s.uid === suite.uid);
    if (idx >= 0) {
      this.suiteStack.splice(this.suiteStack.length - 1 - idx, 1);
    } else if (this.suiteStack.length > 0) {
      this.suiteStack.pop();
    }
  }

  override onTestStart(test: TestStats): void {
    if (this.useCucumber) {
      if (this.scenario) {
        this.scenario.currentStep = test.title;
        MetadataManager.push('qa-step-start', test.title);
      }
      return;
    }
    MetadataManager.clear();
  }

  override onTestPass(test: TestStats): void {
    if (this.useCucumber) {
      this.endCucumberStep(test, 'passed');
      return;
    }
    this.record(test, 'passed');
  }

  override onTestFail(test: TestStats): void {
    if (this.useCucumber) {
      this.endCucumberStep(test, 'failed');
      return;
    }
    this.record(test, 'failed');
  }

  override onTestSkip(test: TestStats): void {
    if (this.useCucumber) {
      this.endCucumberStep(test, 'skipped');
      return;
    }
    this.record(test, 'pending');
  }

  override onTestRetry(test: TestStats): void {
    if (this.useCucumber) {
      this.endCucumberStep(
        test,
        test.state === 'failed' ? 'failed' : 'passed',
      );
      return;
    }
    this.record(test, mapWdioStatus(test.state));
  }

  override async onRunnerEnd(): Promise<void> {
    try {
      await publishBufferedResults();
    } catch {
      // Never fail the WDIO run because of reporter publish errors
    }
  }

  private endCucumberStep(
    test: TestStats,
    status: 'passed' | 'failed' | 'skipped',
  ): void {
    if (!this.scenario) return;
    const name = test.title || this.scenario.currentStep || 'step';
    const messages = status === 'failed' ? failureMessages(test) : [];
    MetadataManager.push('qa-step-end', {
      name,
      status: status === 'skipped' ? 'skipped' : status,
    });
    this.scenario.steps.push({
      name,
      status,
      failureMessages: messages,
    });
    this.scenario.currentStep = undefined;
  }

  private finalizeCucumberScenario(suite: SuiteStats): void {
    const scenario = this.scenario;
    this.scenario = null;
    if (!scenario) return;

    try {
      const children = [
        ...(suite.tests ?? []),
        ...((suite.hooks ?? []) as Array<{ state?: string }>),
      ];

      const stepStatuses = scenario.steps.map((s) => s.status);
      const allSkipped =
        stepStatuses.length > 0 &&
        stepStatuses.every((s) => s === 'skipped') &&
        (children.length === 0 ||
          children.every((c) => (c.state ?? 'passed') === 'skipped' || c.state === 'passed'));

      let status: WdioAssertionInput['status'] = 'passed';
      if (scenario.steps.some((s) => s.status === 'failed') ||
        children.some((c) => c.state === 'failed')) {
        status = 'failed';
      } else if (
        allSkipped ||
        (scenario.steps.length === 0 &&
          children.every((c) => (c.state ?? 'skipped') === 'skipped'))
      ) {
        status = 'pending';
      }

      const failureMessages = scenario.steps
        .filter((s) => s.status === 'failed')
        .flatMap((s) => s.failureMessages);

      const entries = MetadataManager.getEntries();
      let wire = qaMetaFromEntries(entries, {
        framework: 'wdio',
        reporter: 'qa-wdio',
      });
      MetadataManager.clear();

      if (scenario.issueKeys.length > 0) {
        const key = scenario.issueKeys[0]!;
        if (!scenario.title.includes(key)) {
          scenario.title = `${scenario.issueKeys.join(' ')} ${scenario.title}`;
        }
      }

      // Prefer buffered Gherkin step outcomes (includes skipped)
      if (scenario.steps.length > 0) {
        const stepsWire = scenario.steps.map((s, index) => ({
          id: `step-${index}`,
          stepType: 'gherkin' as const,
          name: s.name,
          status: (s.status === 'skipped'
            ? 'skipped'
            : s.status) as 'passed' | 'failed' | 'skipped',
        }));
        wire = {
          ...(wire ?? {}),
          framework: 'wdio',
          reporter: 'qa-wdio',
          steps: stepsWire,
        } as QaMetaWire;
      }

      const title = scenario.title;
      const ancestors = scenario.ancestors;
      const assertion: WdioAssertionInput = {
        ancestorTitles: ancestors,
        title,
        fullName:
          ancestors.length > 0 ? `${ancestors.join(' ')} ${title}` : title,
        status,
        duration: undefined,
        failureMessages: status === 'failed' ? failureMessages : [],
      };
      if (wire) {
        assertion.meta = { qa: wire };
      }

      ResultsBuffer.appendAssertion(scenario.file, assertion);
    } catch {
      // Never fail the WDIO run
    }
  }

  private record(
    test: TestStats,
    state: 'passed' | 'failed' | 'pending' | 'todo',
  ): void {
    try {
      const entries = MetadataManager.getEntries();
      const wire = qaMetaFromEntries(entries, {
        framework: 'wdio',
        reporter: 'qa-wdio',
      });
      MetadataManager.clear();

      const ancestors = ancestorTitles(test, this.suiteStack);
      const title = test.title;
      const assertion: WdioAssertionInput = {
        ancestorTitles: ancestors,
        title,
        fullName:
          ancestors.length > 0 ? `${ancestors.join(' ')} ${title}` : title,
        status: mapWdioStatus(state),
        duration: test.duration,
        failureMessages: state === 'failed' ? failureMessages(test) : [],
      };
      if (wire) {
        assertion.meta = { qa: wire };
      }

      const file =
        (test as TestStats & { file?: string }).file ??
        this.currentFile ??
        'unknown';
      ResultsBuffer.appendAssertion(file, assertion);
    } catch {
      // Never fail the WDIO run
    }
  }
}

export default QaWdioReporter;
