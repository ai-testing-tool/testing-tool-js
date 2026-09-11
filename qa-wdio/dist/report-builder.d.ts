import { type JestVitestJsonReport, type QaMetaWire } from '@ai-testing-tool/forge-commons';
export type WdioAssertionInput = {
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
export type WdioSpecInput = {
    /** Spec file path */
    name: string;
    startTime?: number;
    endTime?: number;
    assertions: WdioAssertionInput[];
};
/**
 * Normalize collected WDIO/Mocha specs into FR41 jest-json shape A.
 */
export declare function toJestJsonReport(specs: readonly WdioSpecInput[], startTime?: number): JestVitestJsonReport;
/** Map WDIO / Mocha test state → FR41 assertion status. */
export declare function mapWdioStatus(status: string | undefined): WdioAssertionInput['status'];
