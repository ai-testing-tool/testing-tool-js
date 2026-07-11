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
    report: JestVitestJsonReport & {
        testResults: JestVitestJsonReport['testResults'];
    };
}
export type BuildIngestPayloadInput = {
    projectKey: string;
    report: JestVitestJsonReport;
    launchName?: string;
    format?: IngestFormat;
    ci?: CiMetadata;
};
export declare function normalizeJestReport(report: JestVitestJsonReport): JestVitestJsonReport;
export declare function buildIngestPayload(input: BuildIngestPayloadInput): IngestPayload;
export declare function estimatePayloadBytes(payload: IngestPayload): number;
