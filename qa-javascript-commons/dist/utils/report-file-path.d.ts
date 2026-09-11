/**
 * Normalize a test file path for FR41 `testResults[].name`.
 * Absolute paths under `cwd` become project-relative (forward slashes).
 * Paths outside `cwd` (or already relative) are left as forward-slash form.
 */
export declare function normalizeReportFilePath(filePath: string, cwd?: string): string;
