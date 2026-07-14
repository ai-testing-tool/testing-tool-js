import type { JestVitestJsonReport } from './jest-vitest-report';
import type { CiMetadata } from '../env';
export type IngestFormat = 'jest-json' | 'vitest-json' | 'normalized' | 'junit-xml';
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
/** FR41 JSON ingest (primary). */
export type JestIngestPayload = IngestPayloadBase & {
    format?: Exclude<IngestFormat, 'junit-xml'>;
    report: JestVitestJsonReport & {
        testResults: NonNullable<JestVitestJsonReport['testResults']>;
    };
};
/** Optional JUnit XML ingest (FR45) — server normalizes to FR41. */
export type JunitIngestPayload = IngestPayloadBase & {
    format: 'junit-xml';
    report: string;
    junitXml?: string;
};
export type IngestPayload = JestIngestPayload | JunitIngestPayload;
export type BuildIngestPayloadInput = {
    projectKey: string;
    report: JestVitestJsonReport | string;
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
export declare function buildIngestPayload(input: BuildIngestPayloadInput & {
    format: 'junit-xml';
    report: string;
}): JunitIngestPayload;
export declare function buildIngestPayload(input: BuildIngestPayloadInput & {
    format?: Exclude<IngestFormat, 'junit-xml'>;
    report: JestVitestJsonReport;
}): JestIngestPayload;
export declare function buildIngestPayload(input: BuildIngestPayloadInput): IngestPayload;
export declare function estimatePayloadBytes(payload: IngestPayload): number;
export {};
