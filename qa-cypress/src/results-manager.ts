import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

import type { CypressSpecInput } from './report-builder';

const DEFAULT_BASENAME = 'qa-cypress-results.json';

/**
 * File bridge across Cypress specs (reporter may run once per spec).
 * Plugin `before:run` clears; reporter appends; `after:run` reads + publishes.
 */
export class ResultsManager {
  static resolvePath(explicit?: string): string {
    if (explicit) return explicit;
    if (process.env.AI_TESTING_TOOL_CYPRESS_RESULTS_PATH) {
      return process.env.AI_TESTING_TOOL_CYPRESS_RESULTS_PATH;
    }
    return join(tmpdir(), DEFAULT_BASENAME);
  }

  static clear(path = ResultsManager.resolvePath()): void {
    if (existsSync(path)) {
      try {
        unlinkSync(path);
      } catch {
        // ignore
      }
    }
  }

  static getSpecs(path = ResultsManager.resolvePath()): CypressSpecInput[] {
    if (!existsSync(path)) return [];
    try {
      const raw = JSON.parse(readFileSync(path, 'utf8')) as {
        specs?: CypressSpecInput[];
      };
      return Array.isArray(raw.specs) ? raw.specs : [];
    } catch {
      return [];
    }
  }

  static appendSpec(
    spec: CypressSpecInput,
    path = ResultsManager.resolvePath(),
  ): void {
    const specs = ResultsManager.getSpecs(path);
    const existing = specs.findIndex((s) => s.name === spec.name);
    if (existing >= 0) {
      specs[existing] = {
        ...spec,
        assertions: [
          ...(specs[existing]?.assertions ?? []),
          ...spec.assertions,
        ],
      };
    } else {
      specs.push(spec);
    }
    try {
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, JSON.stringify({ specs }, null, 0), 'utf8');
    } catch {
      // Never fail the Cypress run
    }
  }
}
