/** Jest / Vitest JSON report (Jest-compatible shape). Mirrors Forge `domain/jest-report/types`. */
export interface JestVitestJsonReport {
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
    testResults?: JestTestFileResult[];
    coverageMap?: unknown;
}
export interface JestTestFileResult {
    name?: string;
    status?: string;
    message?: string;
    startTime?: number;
    endTime?: number;
    assertionResults?: JestAssertionResult[];
}
export interface JestAssertionResult {
    ancestorTitles?: string[];
    fullName?: string;
    title?: string;
    status?: string;
    duration?: number;
    failureMessages?: string[];
    location?: {
        line?: number;
        column?: number;
    };
    meta?: Record<string, unknown>;
}
