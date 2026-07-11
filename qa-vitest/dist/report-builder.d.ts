import type { JestVitestJsonReport } from 'qa-javascript-commons';
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
};
export type CollectedFile = {
    filePath: string;
    cases: CollectedCase[];
};
export declare function buildJestCompatibleReport(files: CollectedFile[], options?: {
    startTime?: number;
}): JestVitestJsonReport;
/** Group flat cases by file path for report building. */
export declare function groupCasesByFile(cases: CollectedCase[]): CollectedFile[];
