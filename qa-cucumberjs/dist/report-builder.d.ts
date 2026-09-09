import type { JestVitestJsonReport, QaMetaWire } from '@ai-testing-tool/forge-commons';
import type { ConvertedScenario } from './modules/event-storage';
export type CucumberAssertionInput = {
    ancestorTitles: string[];
    title: string;
    fullName?: string;
    status: 'passed' | 'failed' | 'pending' | 'todo';
    duration?: number;
    failureMessages?: string[];
    meta?: {
        qa?: QaMetaWire;
    };
};
export type CucumberSpecInput = {
    name: string;
    startTime?: number;
    endTime?: number;
    assertions: CucumberAssertionInput[];
};
/**
 * Upload Cucumber attachments (FR58). Never throws — missing key / oversize /
 * config → metadata-only wire entries.
 */
export declare function uploadScenarioAttachments(scenario: ConvertedScenario, title: string, tagIssueKeys: readonly string[]): Promise<Array<{
    type: string;
    body: unknown;
}>>;
/**
 * Convert a finished Cucumber scenario into one FR41 assertion (or null if @QaIgnore).
 * Pass pre-built attachEntries from {@link uploadScenarioAttachments} when available.
 */
export declare function scenarioToAssertion(scenario: ConvertedScenario, attachEntries?: Array<{
    type: string;
    body: unknown;
}>): CucumberAssertionInput | null;
/**
 * Build assertion including Phase 3 attachment upload (FR58).
 */
export declare function scenarioToAssertionAsync(scenario: ConvertedScenario): Promise<CucumberAssertionInput | null>;
/**
 * Normalize Cucumber scenarios into FR41 jest-json shape A (FR50).
 */
export declare function toJestJsonReport(specs: readonly CucumberSpecInput[], startTime?: number): JestVitestJsonReport;
/** Group assertions by feature URI. */
export declare function specsFromAssertions(assertionsByUri: Map<string, CucumberAssertionInput[]>, runStart: number, runEnd: number): CucumberSpecInput[];
