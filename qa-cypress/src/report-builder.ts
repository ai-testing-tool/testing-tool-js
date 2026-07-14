import type {
  JestAssertionResult,
  JestTestFileResult,
  JestVitestJsonReport,
  QaMetaWire,
} from 'qa-javascript-commons';

export type CypressAssertionInput = {
  ancestorTitles: string[];
  title: string;
  fullName?: string;
  status: 'passed' | 'failed' | 'pending' | 'todo';
  duration?: number;
  failureMessages?: string[];
  meta?: { qa?: QaMetaWire };
};

export type CypressSpecInput = {
  /** Spec path (e.g. cypress/e2e/login.cy.js) */
  name: string;
  startTime?: number;
  endTime?: number;
  assertions: CypressAssertionInput[];
};

function mapAssertion(a: CypressAssertionInput): JestAssertionResult {
  const fullName =
    a.fullName ??
    (a.ancestorTitles.length > 0
      ? `${a.ancestorTitles.join(' ')} ${a.title}`
      : a.title);

  const assertion: JestAssertionResult = {
    ancestorTitles: a.ancestorTitles,
    fullName,
    title: a.title,
    status: a.status,
    duration: a.duration,
    failureMessages: a.failureMessages ?? [],
  };

  if (a.meta?.qa) {
    assertion.meta = { qa: a.meta.qa };
  }

  return assertion;
}

function fileStatus(assertions: JestAssertionResult[]): string {
  return assertions.some((a) => a.status === 'failed') ? 'failed' : 'passed';
}

/**
 * Normalize collected Cypress/Mocha specs into FR41 jest-json shape A.
 */
export function toJestJsonReport(
  specs: readonly CypressSpecInput[],
  startTime?: number,
): JestVitestJsonReport {
  const testResults: JestTestFileResult[] = specs.map((spec) => {
    const assertionResults = spec.assertions.map(mapAssertion);
    return {
      name: spec.name,
      status: fileStatus(assertionResults),
      startTime: spec.startTime,
      endTime: spec.endTime,
      assertionResults,
    };
  });

  let numPassedTests = 0;
  let numFailedTests = 0;
  let numPendingTests = 0;
  let numTodoTests = 0;

  for (const file of testResults) {
    for (const a of file.assertionResults ?? []) {
      if (a.status === 'passed') numPassedTests += 1;
      else if (a.status === 'failed') numFailedTests += 1;
      else if (a.status === 'todo') numTodoTests += 1;
      else numPendingTests += 1;
    }
  }

  const numTotalTests =
    numPassedTests + numFailedTests + numPendingTests + numTodoTests;
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
