import type {
  JestAssertionResult,
  JestTestFileResult,
  JestVitestJsonReport,
  QaMetaWire,
} from 'qa-javascript-commons';

/** Minimal case shape collected by the Vitest reporter (testable without Vitest runtime). */
export type CollectedCase = {
  id: string;
  name: string;
  fullName: string;
  filePath: string;
  ancestorTitles: string[];
  status: 'passed' | 'failed' | 'skipped' | 'pending' | 'todo';
  durationMs: number | null;
  failureMessages: string[];
  startTime?: number;
  /** FR41 assertionResults[].meta.qa */
  metaQa?: QaMetaWire;
};

export type CollectedFile = {
  filePath: string;
  cases: CollectedCase[];
};

function mapAssertionStatus(
  status: CollectedCase['status']
): NonNullable<JestAssertionResult['status']> {
  if (status === 'pending' || status === 'todo') return 'pending';
  return status;
}

export function buildJestCompatibleReport(
  files: CollectedFile[],
  options: { startTime?: number } = {}
): JestVitestJsonReport {
  const startTime = options.startTime ?? Date.now();
  const testResults: JestTestFileResult[] = [];

  let numPassedTests = 0;
  let numFailedTests = 0;
  let numPendingTests = 0;
  let numTodoTests = 0;

  for (const file of files) {
    const assertionResults: JestAssertionResult[] = file.cases.map((c) => {
      const status = mapAssertionStatus(c.status);
      if (status === 'passed') numPassedTests += 1;
      else if (status === 'failed') numFailedTests += 1;
      else if (c.status === 'todo') numTodoTests += 1;
      else numPendingTests += 1;

      const assertion: JestAssertionResult = {
        ancestorTitles: c.ancestorTitles,
        fullName: c.fullName,
        title: c.name,
        status,
        duration: c.durationMs ?? undefined,
        failureMessages: c.failureMessages,
      };

      if (c.metaQa) {
        assertion.meta = { qa: c.metaQa };
      }

      return assertion;
    });

    const fileFailed = assertionResults.some((a) => a.status === 'failed');
    testResults.push({
      name: file.filePath,
      status: fileFailed ? 'failed' : 'passed',
      startTime,
      endTime: Date.now(),
      assertionResults,
    });
  }

  const numTotalTests = numPassedTests + numFailedTests + numPendingTests + numTodoTests;
  const numFailedTestSuites = testResults.filter((t) => t.status === 'failed').length;
  const numPassedTestSuites = testResults.length - numFailedTestSuites;

  return {
    numTotalTestSuites: testResults.length,
    numPassedTestSuites,
    numFailedTestSuites,
    numPendingTestSuites: 0,
    numTotalTests,
    numPassedTests,
    numFailedTests,
    numPendingTests,
    numTodoTests,
    startTime,
    success: numFailedTests === 0,
    testResults,
  };
}

/** Group flat cases by file path for report building. */
export function groupCasesByFile(cases: CollectedCase[]): CollectedFile[] {
  const map = new Map<string, CollectedCase[]>();
  for (const c of cases) {
    const list = map.get(c.filePath) ?? [];
    list.push(c);
    map.set(c.filePath, list);
  }
  return [...map.entries()].map(([filePath, fileCases]) => ({
    filePath,
    cases: fileCases,
  }));
}
