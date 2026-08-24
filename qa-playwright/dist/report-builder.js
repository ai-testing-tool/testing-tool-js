"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toJestJsonReport = toJestJsonReport;
exports.mapPlaywrightStatus = mapPlaywrightStatus;
function mapAssertion(a) {
    const fullName = a.fullName ??
        (a.ancestorTitles.length > 0
            ? `${a.ancestorTitles.join(' ')} ${a.title}`
            : a.title);
    // Suite hierarchy lives in meta.qa.suite; omit ancestorTitles from FR41.
    const assertion = {
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
function fileStatus(assertions) {
    return assertions.some((a) => a.status === 'failed') ? 'failed' : 'passed';
}
/**
 * Normalize collected Playwright specs into FR41 jest-json shape A.
 */
function toJestJsonReport(specs, startTime) {
    const testResults = specs.map((spec) => {
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
            if (a.status === 'passed')
                numPassedTests += 1;
            else if (a.status === 'failed')
                numFailedTests += 1;
            else if (a.status === 'todo')
                numTodoTests += 1;
            else
                numPendingTests += 1;
        }
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
/** Map Playwright TestResult.status → FR41 assertion status. */
function mapPlaywrightStatus(status) {
    if (status === 'passed')
        return 'passed';
    if (status === 'skipped')
        return 'pending';
    if (status === 'failed' || status === 'timedOut' || status === 'interrupted') {
        return 'failed';
    }
    return 'pending';
}
