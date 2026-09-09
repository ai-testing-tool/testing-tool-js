import type {
  JestAssertionResult,
  JestTestFileResult,
  JestVitestJsonReport,
  QaMetaWire,
} from '@ai-testing-tool/forge-commons';

/**
 * Minimal AggregatedResult / --json shapes accepted by the mapper.
 * Jest onRunComplete uses `testFilePath` + nested `testResults`;
 * native `--json` uses `name` + `assertionResults`.
 */
export type AggregatedAssertionLike = {
  ancestorTitles?: string[];
  fullName?: string;
  title?: string;
  status?: string;
  duration?: number | null;
  failureMessages?: string[];
};

export type AggregatedFileLike = {
  name?: string;
  testFilePath?: string;
  status?: string;
  message?: string;
  startTime?: number;
  endTime?: number;
  assertionResults?: AggregatedAssertionLike[];
  /** Jest AggregatedResult nested assertions */
  testResults?: AggregatedAssertionLike[];
};

export type AggregatedResultLike = {
  numTotalTestSuites?: number;
  numPassedTestSuites?: number;
  numFailedTestSuites?: number;
  numPendingTestSuites?: number;
  numTotalTests?: number;
  numPassedTests?: number;
  numFailedTests?: number;
  numPendingTests?: number;
  numTodoTests?: number;
  startTime?: number;
  success?: boolean;
  testResults?: AggregatedFileLike[];
};

function mapAssertion(
  a: AggregatedAssertionLike,
  metaByFullName?: ReadonlyMap<string, QaMetaWire>,
): JestAssertionResult {
  const fullName = a.fullName ?? a.title ?? '';
  // Suite hierarchy lives in meta.qa.suite (from qa helpers); omit Jest's
  // ancestorTitles from the FR41 payload to avoid duplicating that data.
  const assertion: JestAssertionResult = {
    fullName,
    title: a.title ?? '',
    status: a.status,
    duration: a.duration ?? undefined,
    failureMessages: a.failureMessages ?? [],
  };

  const qa = metaByFullName?.get(fullName);
  if (qa) {
    assertion.meta = { qa };
  }

  return assertion;
}

function fileStatus(
  file: AggregatedFileLike,
  assertions: JestAssertionResult[],
): string {
  if (file.status) return file.status;
  return assertions.some((a) => a.status === 'failed') ? 'failed' : 'passed';
}

/**
 * Normalize Jest AggregatedResult or native `--json` output into FR41 jest-json shape.
 * Optional `metaByFullName` attaches `meta.qa` from qa helpers (reporter path).
 */
export function toJestJsonReport(
  results: AggregatedResultLike,
  metaByFullName?: ReadonlyMap<string, QaMetaWire>,
): JestVitestJsonReport {
  const testResults: JestTestFileResult[] = (results.testResults ?? []).map((file) => {
    const rawAssertions = file.assertionResults ?? file.testResults ?? [];
    const assertionResults = rawAssertions.map((a) => mapAssertion(a, metaByFullName));
    return {
      name: file.name ?? file.testFilePath ?? 'unknown',
      status: fileStatus(file, assertionResults),
      message: file.message,
      startTime: file.startTime,
      endTime: file.endTime,
      assertionResults,
    };
  });

  let numPassedTests = results.numPassedTests;
  let numFailedTests = results.numFailedTests;
  let numPendingTests = results.numPendingTests;
  let numTodoTests = results.numTodoTests;
  let numTotalTests = results.numTotalTests;

  if (
    numPassedTests === undefined ||
    numFailedTests === undefined ||
    numPendingTests === undefined ||
    numTotalTests === undefined
  ) {
    numPassedTests = 0;
    numFailedTests = 0;
    numPendingTests = 0;
    numTodoTests = 0;
    for (const file of testResults) {
      for (const a of file.assertionResults ?? []) {
        if (a.status === 'passed') numPassedTests += 1;
        else if (a.status === 'failed') numFailedTests += 1;
        else if (a.status === 'todo') numTodoTests += 1;
        else numPendingTests += 1;
      }
    }
    numTotalTests = numPassedTests + numFailedTests + numPendingTests + numTodoTests;
  }

  const numFailedTestSuites =
    results.numFailedTestSuites ??
    testResults.filter((t) => t.status === 'failed').length;
  const numPassedTestSuites =
    results.numPassedTestSuites ?? testResults.length - numFailedTestSuites;

  // Failed-suite check catches runtime-error suites that have no failed assertions.
  const derivedSuccess = numFailedTests === 0 && numFailedTestSuites === 0;

  return {
    numTotalTestSuites: results.numTotalTestSuites ?? testResults.length,
    numPassedTestSuites,
    numFailedTestSuites,
    numPendingTestSuites: results.numPendingTestSuites ?? 0,
    numTotalTests,
    numPassedTests,
    numFailedTests,
    numPendingTests,
    numTodoTests: numTodoTests ?? 0,
    startTime: results.startTime,
    success: results.success ?? derivedSuccess,
    testResults,
  };
}
