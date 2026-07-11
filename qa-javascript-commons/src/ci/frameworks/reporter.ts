import type { CiTemplateContext } from '../types';

/** Vitest run when qa-vitest is configured in vitest.config.ts. */
export function vitestReporterRun(): string {
  return 'npx vitest run';
}

/**
 * Env block lines for reporter ingest (platform supplies expression values).
 * Caller wraps in YAML/Groovy structure.
 */
export function reporterIngestEnvLines(ctx: CiTemplateContext): {
  mode: string;
  url: string;
  token: string;
  project: string;
} {
  return {
    mode: 'ingest',
    url: ctx.ingestUrlExpr ?? ctx.ingestUrlSecret,
    token: ctx.ingestTokenExpr ?? ctx.ingestTokenSecret,
    project: ctx.projectKeyExpr ?? ctx.projectKey,
  };
}

export function assertVitestReporter(ctx: CiTemplateContext): void {
  if (ctx.framework !== 'vitest') {
    throw new Error('Reporter path is only supported for Vitest (qa-vitest)');
  }
}
