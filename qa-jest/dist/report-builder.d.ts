import type { JestVitestJsonReport, QaMetaWire } from 'qa-javascript-commons';
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
/**
 * Normalize Jest AggregatedResult or native `--json` output into FR41 jest-json shape.
 * Optional `metaByFullName` attaches `meta.qa` from qa helpers (reporter path).
 */
export declare function toJestJsonReport(results: AggregatedResultLike, metaByFullName?: ReadonlyMap<string, QaMetaWire>): JestVitestJsonReport;
