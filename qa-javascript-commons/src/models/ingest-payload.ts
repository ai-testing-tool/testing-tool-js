import type { JestVitestJsonReport } from './jest-vitest-report';
import type { CiMetadata } from '../env';

export type IngestFormat = 'jest-json' | 'vitest-json' | 'normalized';

/** FR41 preferred ingest body (client → Forge). */
export interface IngestPayload {
  projectKey: string;
  launchName?: string;
  format?: IngestFormat;
  ciPlatform?: string;
  buildUrl?: string;
  gitCommitSha?: string;
  gitBranch?: string;
  gitAuthorName?: string;
  gitAuthorEmail?: string;
  report: JestVitestJsonReport & { testResults: JestVitestJsonReport['testResults'] };
}

export type BuildIngestPayloadInput = {
  projectKey: string;
  report: JestVitestJsonReport;
  launchName?: string;
  format?: IngestFormat;
  ci?: CiMetadata;
};

export function normalizeJestReport(report: JestVitestJsonReport): JestVitestJsonReport {
  return {
    ...report,
    testResults: Array.isArray(report.testResults) ? report.testResults : [],
  };
}

export function buildIngestPayload(input: BuildIngestPayloadInput): IngestPayload {
  const normalized = normalizeJestReport(input.report);
  if (!input.projectKey?.trim()) {
    throw new Error('projectKey is required to build an ingest payload');
  }

  return {
    projectKey: input.projectKey.trim(),
    launchName: input.launchName,
    format: input.format ?? 'jest-json',
    ciPlatform: input.ci?.ciPlatform,
    buildUrl: input.ci?.buildUrl,
    gitCommitSha: input.ci?.gitCommitSha,
    gitBranch: input.ci?.gitBranch,
    gitAuthorName: input.ci?.gitAuthorName,
    gitAuthorEmail: input.ci?.gitAuthorEmail,
    report: {
      ...normalized,
      testResults: normalized.testResults ?? [],
    },
  };
}

export function estimatePayloadBytes(payload: IngestPayload): number {
  return Buffer.byteLength(JSON.stringify(payload), 'utf8');
}
