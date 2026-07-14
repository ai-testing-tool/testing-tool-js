import type { JestVitestJsonReport, QaMetaWire } from 'qa-javascript-commons';
export type CypressAssertionInput = {
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
export type CypressSpecInput = {
    /** Spec path (e.g. cypress/e2e/login.cy.js) */
    name: string;
    startTime?: number;
    endTime?: number;
    assertions: CypressAssertionInput[];
};
/**
 * Normalize collected Cypress/Mocha specs into FR41 jest-json shape A.
 */
export declare function toJestJsonReport(specs: readonly CypressSpecInput[], startTime?: number): JestVitestJsonReport;
