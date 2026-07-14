import type { ConfigType } from './config';
import { type IngestPayload, type JestVitestJsonReport } from './models';
import { type OptionsType } from './options';
export type PublishReportOptions = {
    projectKey?: string;
    launchName?: string;
    format?: IngestPayload['format'];
    planId?: string;
    planKey?: string;
    planName?: string;
    fixVersion?: string;
    sprintName?: string;
};
/**
 * Thin orchestrator over OptionsResolver, ReporterFactory, and FallbackCoordinator.
 * Framework adapters call `publishReport` with runner JSON at end of test run.
 */
export declare class QAnalyzerReporter {
    private static instance;
    private readonly options;
    private readonly logger;
    private readonly fallback;
    private constructor();
    static getInstance(options?: OptionsType): QAnalyzerReporter;
    static resetInstance(): void;
    getConfig(): ConfigType & OptionsType;
    publishReport(report: JestVitestJsonReport, overrides?: PublishReportOptions): Promise<IngestPayload | undefined>;
    private buildReporters;
}
