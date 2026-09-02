import type { JestVitestJsonReport } from './jest-vitest-report';
import type { CiMetadata } from '../env';

export type IngestFormat = 'jest-json' | 'vitest-json' | 'normalized';

type IngestPayloadBase = {
  projectKey: string;
  launchName?: string;
  planId?: string;
  planKey?: string;
  planName?: string;
  fixVersion?: string;
  sprintName?: string;
  ciPlatform?: string;
  buildUrl?: string;
  gitCommitSha?: string;
  gitBranch?: string;
  gitAuthorName?: string;
  gitAuthorEmail?: string;
};

/** FR41 JSON ingest. */
export type IngestPayload = IngestPayloadBase & {
  format?: IngestFormat;
  report: JestVitestJsonReport & { testResults: NonNullable<JestVitestJsonReport['testResults']> };
};

export type BuildIngestPayloadInput = {
  projectKey: string;
  report: JestVitestJsonReport;
  launchName?: string;
  format?: IngestFormat;
  planId?: string;
  planKey?: string;
  planName?: string;
  fixVersion?: string;
  sprintName?: string;
  ci?: CiMetadata;
};

export function normalizeJestReport(report: JestVitestJsonReport): JestVitestJsonReport {
  return {
    ...report,
    testResults: Array.isArray(report.testResults) ? report.testResults : [],
  };
}

export function buildIngestPayload(input: BuildIngestPayloadInput): IngestPayload {
  if (!input.projectKey?.trim()) {
    throw new Error('projectKey is required to build an ingest payload');
  }

  if (!input.report || typeof input.report !== 'object') {
    throw new Error('Jest/Vitest ingest requires a JSON report object');
  }

  const base: IngestPayloadBase = {
    projectKey: input.projectKey.trim(),
    launchName: input.launchName,
    planId: input.planId?.trim() || undefined,
    planKey: input.planKey?.trim() || undefined,
    planName: input.planName?.trim() || undefined,
    fixVersion: input.fixVersion?.trim() || undefined,
    sprintName: input.sprintName?.trim() || undefined,
    ciPlatform: input.ci?.ciPlatform,
    buildUrl: input.ci?.buildUrl,
    gitCommitSha: input.ci?.gitCommitSha,
    gitBranch: input.ci?.gitBranch,
    gitAuthorName: input.ci?.gitAuthorName,
    gitAuthorEmail: input.ci?.gitAuthorEmail,
  };

  const normalized = normalizeJestReport(input.report);
  return {
    ...base,
    format: input.format ?? 'jest-json',
    report: {
      ...normalized,
      testResults: normalized.testResults ?? [],
    },
  };
}

export function estimatePayloadBytes(payload: IngestPayload): number {
  return Buffer.byteLength(JSON.stringify(payload), 'utf8');
}
