import type { IngestPayload } from '../models';
import type { JestTestFileResult, JestVitestJsonReport } from '../models/jest-vitest-report';
export declare const MAX_INGEST_SESSION_CHUNKS = 100;
export declare const DEFAULT_CHUNK_THRESHOLD_BYTES = 3500000;
export declare const DEFAULT_CHUNK_MAX_BYTES = 3000000;
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
    gitCommitSha?: string;
    gitBranch?: string;
    gitAuthorName?: string;
    gitAuthorEmail?: string;
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
export declare function createIngestSessionId(payload: IngestPayload): string;
export declare function planChunks(payload: IngestPayload, options?: PlanChunksOptions): ChunkPlan;
