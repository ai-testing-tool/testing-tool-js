"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildJestCompatibleReport = buildJestCompatibleReport;
exports.groupCasesByFile = groupCasesByFile;
function mapAssertionStatus(status) {
    if (status === 'pending' || status === 'todo')
        return 'pending';
    return status;
}
function buildJestCompatibleReport(files, options = {}) {
    const startTime = options.startTime ?? Date.now();
    const testResults = [];
    let numPassedTests = 0;
    let numFailedTests = 0;
    let numPendingTests = 0;
    let numTodoTests = 0;
    for (const file of files) {
        const assertionResults = file.cases.map((c) => {
            const status = mapAssertionStatus(c.status);
            if (status === 'passed')
                numPassedTests += 1;
            else if (status === 'failed')
                numFailedTests += 1;
            else if (c.status === 'todo')
                numTodoTests += 1;
            else
                numPendingTests += 1;
            // Suite hierarchy lives in meta.qa.suite (from qa helpers); omit Jest's
            // ancestorTitles from the FR41 payload to avoid duplicating that data.
            const assertion = {
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
function groupCasesByFile(cases) {
    const map = new Map();
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
