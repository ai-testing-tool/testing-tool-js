import { isAbsolute, relative } from 'node:path';

/**
 * Normalize a test file path for FR41 `testResults[].name`.
 * Absolute paths under `cwd` become project-relative (forward slashes).
 * Paths outside `cwd` (or already relative) are left as forward-slash form.
 */
export function normalizeReportFilePath(
  filePath: string,
  cwd: string = process.cwd(),
): string {
  const trimmed = filePath.trim();
  if (!trimmed) return trimmed;

  const forward = trimmed.replace(/\\/g, '/');
  if (!isAbsolute(trimmed)) {
    return forward.replace(/^\.\//, '');
  }

  const rel = relative(cwd, trimmed);
  if (!rel || rel.startsWith('..') || isAbsolute(rel)) {
    return forward;
  }
  return rel.replace(/\\/g, '/');
}
