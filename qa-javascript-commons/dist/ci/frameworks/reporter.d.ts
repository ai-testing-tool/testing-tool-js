import type { CiTemplateContext } from '../types';
/** Vitest run when qa-vitest is configured in vitest.config.ts. */
export declare function vitestReporterRun(): string;
/**
 * Env block lines for reporter ingest (platform supplies expression values).
 * Caller wraps in YAML/Groovy structure.
 */
export declare function reporterIngestEnvLines(ctx: CiTemplateContext): {
    mode: string;
    url: string;
    token: string;
    project: string;
};
export declare function assertVitestReporter(ctx: CiTemplateContext): void;
