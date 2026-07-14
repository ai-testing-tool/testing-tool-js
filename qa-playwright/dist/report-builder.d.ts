import type { JestVitestJsonReport, QaMetaWire } from 'qa-javascript-commons';
export type PlaywrightAssertionInput = {
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
export type PlaywrightSpecInput = {
    /** Spec file path */
    name: string;
    startTime?: number;
    endTime?: number;
    assertions: PlaywrightAssertionInput[];
};
/**
 * Normalize collected Playwright specs into FR41 jest-json shape A.
 */
export declare function toJestJsonReport(specs: readonly PlaywrightSpecInput[], startTime?: number): JestVitestJsonReport;
/** Map Playwright TestResult.status → FR41 assertion status. */
export declare function mapPlaywrightStatus(status: string | undefined): PlaywrightAssertionInput['status'];
