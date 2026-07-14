import type { Envelope, Pickle, TestCaseFinished } from '@cucumber/messages';
export type FeatureInfo = {
    name: string;
    uri: string;
};
export type FinishedStep = {
    pickleStepId: string | undefined;
    text: string;
    status: string;
    message?: string;
    durationMs: number;
};
/** Captured Cucumber `this.attach()` payload (envelope.attachment). */
export type StoredAttachment = {
    body: string;
    contentEncoding: string;
    mediaType: string;
    fileName?: string;
    testCaseStartedId?: string;
    testStepId?: string;
};
export type ConvertedScenario = {
    featureName: string;
    uri: string;
    title: string;
    pickle: Pickle;
    status: 'passed' | 'failed' | 'pending';
    durationMs: number;
    failureMessages: string[];
    steps: FinishedStep[];
    attachments: StoredAttachment[];
};
/**
 * Collects Cucumber message envelopes until a scenario can be converted.
 */
export declare class EventStorage {
    private readonly featuresByUri;
    private readonly pickles;
    private readonly testCases;
    private readonly testCaseStarts;
    private readonly stepFinishedByTestStepId;
    private readonly featureNameByScenarioAstId;
    private readonly attachmentsByStartedId;
    ingest(envelope: Envelope): void;
    convertFinished(finished: TestCaseFinished): ConvertedScenario | undefined;
    private addAttachment;
    private addGherkin;
    private featureNameForPickle;
}
