import { createHash, randomUUID } from 'node:crypto';

import type { IngestPayload } from '../models';
import type { JestTestFileResult, JestVitestJsonReport } from '../models/jest-vitest-report';

export const MAX_INGEST_SESSION_CHUNKS = 100;

export const DEFAULT_CHUNK_THRESHOLD_BYTES = 3_500_000;
export const DEFAULT_CHUNK_MAX_BYTES = 3_000_000;

export type IngestSessionBody = {
  action: 'session';
  sessionId: string;
  projectKey: string;
  expectedChunks: number;
  launchName?: string;
  format?: string;
  planId?: string;
  planKey?: string;
  planName?: string;
  fixVersion?: string;
  sprintName?: string;
  buildUrl?: string;
  ciPlatform?: string;
  reportMeta: Omit<JestVitestJsonReport, 'testResults'>;
};

export type IngestChunkBody = {
  action: 'chunk';
  sessionId: string;
  chunkIndex: number;
  testResults: JestTestFileResult[];
};

export type IngestCompleteBody = {
  action: 'complete';
  sessionId: string;
};

export type ChunkPlan = {
  sessionId: string;
  sessionBody: IngestSessionBody;
  chunks: IngestChunkBody[];
  completeBody: IngestCompleteBody;
};

export type PlanChunksOptions = {
  maxChunkBytes?: number;
  maxChunks?: number;
  sessionId?: string;
};

function reportMetaFromPayload(report: IngestPayload['report']): IngestSessionBody['reportMeta'] {
  const { testResults: _ignored, ...reportMeta } = report;
  return reportMeta;
}

function estimateChunkBodyBytes(
  sessionId: string,
  chunkIndex: number,
  testResults: JestTestFileResult[],
): number {
  return Buffer.byteLength(
    JSON.stringify({
      action: 'chunk',
      sessionId,
      chunkIndex,
      testResults,
    }),
    'utf8',
  );
}

function splitTestResults(
  sessionId: string,
  testResults: JestTestFileResult[],
  maxChunkBytes: number,
): JestTestFileResult[][] {
  if (testResults.length === 0) {
    return [[]];
  }

  const groups: JestTestFileResult[][] = [];
  let current: JestTestFileResult[] = [];

  for (const item of testResults) {
    const candidate = [...current, item];
    const candidateBytes = estimateChunkBodyBytes(sessionId, groups.length, candidate);
    if (current.length > 0 && candidateBytes > maxChunkBytes) {
      groups.push(current);
      current = [item];
    } else {
      current = candidate;
    }

    const currentBytes = estimateChunkBodyBytes(sessionId, groups.length, current);
    if (currentBytes > maxChunkBytes) {
      throw new Error(
        `Single test file result exceeds max chunk size (${maxChunkBytes} bytes); reduce attachments or split the suite`,
      );
    }
  }

  if (current.length > 0) {
    groups.push(current);
  }

  return groups;
}

export function createIngestSessionId(payload: IngestPayload): string {
  const fingerprint = [
    payload.projectKey,
    payload.launchName ?? '',
    payload.buildUrl ?? '',
    payload.gitCommitSha ?? '',
  ].join('|');

  if (!fingerprint.replace(/\|/g, '').trim()) {
    return randomUUID();
  }

  return createHash('sha256').update(fingerprint).digest('hex').slice(0, 32);
}

export function planChunks(payload: IngestPayload, options: PlanChunksOptions = {}): ChunkPlan {
  const maxChunkBytes = options.maxChunkBytes ?? DEFAULT_CHUNK_MAX_BYTES;
  const maxChunks = options.maxChunks ?? MAX_INGEST_SESSION_CHUNKS;
  const sessionId = options.sessionId ?? createIngestSessionId(payload);
  const testResults = payload.report.testResults ?? [];
  const groups = splitTestResults(sessionId, testResults, maxChunkBytes);

  if (groups.length > maxChunks) {
    throw new Error(
      `Ingest report requires ${groups.length} chunks; maximum allowed is ${maxChunks}. Reduce report size or split CI jobs.`,
    );
  }

  const sessionBody: IngestSessionBody = {
    action: 'session',
    sessionId,
    projectKey: payload.projectKey,
    expectedChunks: groups.length,
    launchName: payload.launchName,
    format: payload.format,
    planId: payload.planId,
    planKey: payload.planKey,
    planName: payload.planName,
    fixVersion: payload.fixVersion,
    sprintName: payload.sprintName,
    buildUrl: payload.buildUrl,
    ciPlatform: payload.ciPlatform,
    reportMeta: reportMetaFromPayload(payload.report),
  };

  const chunks: IngestChunkBody[] = groups.map((group, chunkIndex) => ({
    action: 'chunk',
    sessionId,
    chunkIndex,
    testResults: group,
  }));

  return {
    sessionId,
    sessionBody,
    chunks,
    completeBody: {
      action: 'complete',
      sessionId,
    },
  };
}
