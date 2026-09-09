/**
 * Bridge for Cypress `after:screenshot` details → plugin `after:run` upload (FR71).
 */
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

export type CypressScreenshotRecord = {
  path: string;
  name?: string;
  specName?: string;
  testFailure?: boolean;
  takenAt?: string;
};

const DEFAULT_BASENAME = 'qa-cypress-screenshots.json';

function defaultPath(): string {
  if (process.env.AI_TESTING_TOOL_CYPRESS_SCREENSHOTS_PATH) {
    return process.env.AI_TESTING_TOOL_CYPRESS_SCREENSHOTS_PATH;
  }
  const results = process.env.AI_TESTING_TOOL_CYPRESS_RESULTS_PATH;
  if (results) {
    return results.replace(/\.json$/i, '') + '-screenshots.json';
  }
  return join(tmpdir(), DEFAULT_BASENAME);
}

export class ScreenshotsManager {
  static resolvePath(explicit?: string): string {
    return explicit ?? defaultPath();
  }

  static clear(path = ScreenshotsManager.resolvePath()): void {
    if (existsSync(path)) {
      try {
        unlinkSync(path);
      } catch {
        // ignore
      }
    }
  }

  static getAll(path = ScreenshotsManager.resolvePath()): CypressScreenshotRecord[] {
    if (!existsSync(path)) return [];
    try {
      const raw = JSON.parse(readFileSync(path, 'utf8')) as {
        screenshots?: CypressScreenshotRecord[];
      };
      return Array.isArray(raw.screenshots) ? raw.screenshots : [];
    } catch {
      return [];
    }
  }

  static append(
    record: CypressScreenshotRecord,
    path = ScreenshotsManager.resolvePath(),
  ): void {
    if (!record.path) return;
    const screenshots = ScreenshotsManager.getAll(path);
    screenshots.push(record);
    try {
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, JSON.stringify({ screenshots }, null, 0), 'utf8');
    } catch {
      // Never fail the Cypress run
    }
  }
}

/** True for still images; videos are skipped (Phase 3 still-image only). */
export function isStillImagePath(filePath: string): boolean {
  return /\.(png|jpe?g|webp|bmp)$/i.test(filePath);
}

function belongsToSpec(shot: CypressScreenshotRecord, specName: string): boolean {
  if (!shot.specName) {
    // Path often contains the relative spec path
    const hay = shot.path.replace(/\\/g, '/').toLowerCase();
    const want = specName.replace(/\\/g, '/').toLowerCase();
    const base = want.split('/').pop() ?? want;
    return Boolean(base && hay.includes(base));
  }
  const normSpec = shot.specName.replace(/\\/g, '/').toLowerCase();
  const normName = specName.replace(/\\/g, '/').toLowerCase();
  return (
    normName.endsWith(normSpec) ||
    normSpec.endsWith(normName) ||
    normName.includes(normSpec) ||
    normSpec.includes(normName.split('/').pop() ?? '')
  );
}

/**
 * Match a failure screenshot to a failed assertion by title / fullName.
 */
export function matchScreenshotToAssertion(
  shot: CypressScreenshotRecord,
  assertion: { title: string; fullName?: string; status: string },
  specName: string,
): boolean {
  if (assertion.status !== 'failed') return false;
  if (shot.testFailure === false) return false;
  if (!isStillImagePath(shot.path)) return false;
  if (!belongsToSpec(shot, specName)) return false;

  const haystack = `${shot.path} ${shot.name ?? ''}`.toLowerCase();
  const title = assertion.title.toLowerCase();
  if (title && haystack.includes(title)) return true;

  const full = (assertion.fullName ?? '').toLowerCase();
  if (full && haystack.includes(full)) return true;

  return false;
}

/** Next unused failure still-image for this spec (ordered fallback). */
export function nextUnusedSpecScreenshot(
  shots: readonly CypressScreenshotRecord[],
  used: ReadonlySet<number>,
  specName: string,
): number {
  return shots.findIndex(
    (s, i) =>
      !used.has(i) &&
      s.testFailure !== false &&
      isStillImagePath(s.path) &&
      belongsToSpec(s, specName),
  );
}
