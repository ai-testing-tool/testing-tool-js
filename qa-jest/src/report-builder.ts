import type { JestAssertionResult, JestTestFileResult, JestVitestJsonReport } from 'qa-javascript-commons';

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

function mapAssertion(a: AggregatedAssertionLike): JestAssertionResult {
  return {
    ancestorTitles: a.ancestorTitles ?? [],
    fullName: a.fullName ?? a.title ?? '',
    title: a.title ?? '',
    status: a.status,
    duration: a.duration ?? undefined,
    failureMessages: a.failureMessages ?? [],
  };
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
 */
export function toJestJsonReport(results: AggregatedResultLike): JestVitestJsonReport {
  const testResults: JestTestFileResult[] = (results.testResults ?? []).map((file) => {
    const rawAssertions = file.assertionResults ?? file.testResults ?? [];
    const assertionResults = rawAssertions.map(mapAssertion);
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
    success: results.success ?? numFailedTests === 0,
    testResults,
  };
}
