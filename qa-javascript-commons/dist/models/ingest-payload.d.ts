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
    report: JestVitestJsonReport & {
        testResults: NonNullable<JestVitestJsonReport['testResults']>;
    };
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
export declare function normalizeJestReport(report: JestVitestJsonReport): JestVitestJsonReport;
export declare function buildIngestPayload(input: BuildIngestPayloadInput): IngestPayload;
export declare function estimatePayloadBytes(payload: IngestPayload): number;
export {};
