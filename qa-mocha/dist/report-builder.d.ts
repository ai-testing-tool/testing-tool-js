import type { JestVitestJsonReport, QaMetaWire } from 'qa-javascript-commons';
export type MochaAssertionInput = {
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
export type MochaSpecInput = {
    /** Spec path (e.g. test/api-crud.spec.js) */
    name: string;
    startTime?: number;
    endTime?: number;
    assertions: MochaAssertionInput[];
};
/**
 * Normalize collected Mocha specs into FR41 jest-json shape A.
 */
export declare function toJestJsonReport(specs: readonly MochaSpecInput[], startTime?: number): JestVitestJsonReport;
