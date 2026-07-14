"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventStorage = void 0;
function durationMs(ts) {
    if (!ts)
        return 0;
    const seconds = Number(ts.seconds ?? 0);
    const nanos = Number(ts.nanos ?? 0);
    return seconds * 1000 + Math.round(nanos / 1e6);
}
function timestampMs(ts) {
    if (!ts)
        return Date.now();
    const seconds = Number(ts.seconds ?? 0);
    const nanos = Number(ts.nanos ?? 0);
    return seconds * 1000 + Math.round(nanos / 1e6);
}
function toStoredAttachment(attachment) {
    return {
        body: attachment.body ?? '',
        contentEncoding: String(attachment.contentEncoding ?? 'IDENTITY'),
        mediaType: attachment.mediaType ?? 'application/octet-stream',
        fileName: attachment.fileName,
        testCaseStartedId: attachment.testCaseStartedId,
        testStepId: attachment.testStepId,
    };
}
/**
 * Collects Cucumber message envelopes until a scenario can be converted.
 */
class EventStorage {
    featuresByUri = new Map();
    pickles = new Map();
    testCases = new Map();
    testCaseStarts = new Map();
    stepFinishedByTestStepId = new Map();
    featureNameByScenarioAstId = new Map();
    attachmentsByStartedId = new Map();
    ingest(envelope) {
        if (envelope.gherkinDocument) {
            this.addGherkin(envelope.gherkinDocument);
            return;
        }
        if (envelope.pickle) {
            this.pickles.set(envelope.pickle.id, envelope.pickle);
            return;
        }
        if (envelope.testCase) {
            this.testCases.set(envelope.testCase.id, envelope.testCase);
            return;
        }
        if (envelope.testCaseStarted) {
            this.testCaseStarts.set(envelope.testCaseStarted.id, envelope.testCaseStarted);
            return;
        }
        if (envelope.testStepFinished) {
            this.stepFinishedByTestStepId.set(envelope.testStepFinished.testStepId, envelope.testStepFinished);
            return;
        }
        if (envelope.attachment) {
            this.addAttachment(envelope.attachment);
        }
    }
    convertFinished(finished) {
        const started = this.testCaseStarts.get(finished.testCaseStartedId);
        if (!started)
            return undefined;
        const testCase = this.testCases.get(started.testCaseId);
        if (!testCase)
            return undefined;
        const pickle = this.pickles.get(testCase.pickleId);
        if (!pickle)
            return undefined;
        const uri = pickle.uri ?? 'unknown.feature';
        const feature = this.featuresByUri.get(uri)?.name ??
            this.featureNameForPickle(pickle) ??
            'Feature';
        const steps = [];
        const failureMessages = [];
        let anyFailed = false;
        let anyPending = false;
        for (const testStep of testCase.testSteps ?? []) {
            if (!testStep.pickleStepId)
                continue; // hook steps
            const finishedStep = this.stepFinishedByTestStepId.get(testStep.id);
            if (!finishedStep)
                continue;
            const pickleStep = pickle.steps?.find((s) => s.id === testStep.pickleStepId);
            const status = String(finishedStep.testStepResult?.status ?? 'UNKNOWN');
            const message = finishedStep.testStepResult?.message ?? undefined;
            steps.push({
                pickleStepId: testStep.pickleStepId,
                text: pickleStep?.text ?? testStep.pickleStepId,
                status,
                message,
                durationMs: durationMs(finishedStep.testStepResult?.duration),
            });
            if (status === 'FAILED' || status === 'AMBIGUOUS') {
                anyFailed = true;
                if (message)
                    failureMessages.push(message);
            }
            else if (status === 'PENDING' ||
                status === 'UNDEFINED' ||
                status === 'SKIPPED') {
                anyPending = true;
            }
        }
        const startMs = timestampMs(started.timestamp);
        const endMs = timestampMs(finished.timestamp);
        let status = 'passed';
        if (anyFailed)
            status = 'failed';
        else if (anyPending && steps.every((s) => s.status !== 'PASSED')) {
            status = 'pending';
        }
        else if (anyPending && !anyFailed) {
            // Background skips alone — treat as passed if at least one passed step
            status = steps.some((s) => s.status === 'PASSED') ? 'passed' : 'pending';
        }
        const attachments = this.attachmentsByStartedId.get(finished.testCaseStartedId) ?? [];
        this.attachmentsByStartedId.delete(finished.testCaseStartedId);
        return {
            featureName: feature,
            uri,
            title: pickle.name,
            pickle,
            status,
            durationMs: Math.max(0, endMs - startMs),
            failureMessages,
            steps,
            attachments,
        };
    }
    addAttachment(attachment) {
        const startedId = attachment.testCaseStartedId;
        if (!startedId)
            return;
        const list = this.attachmentsByStartedId.get(startedId) ?? [];
        list.push(toStoredAttachment(attachment));
        this.attachmentsByStartedId.set(startedId, list);
    }
    addGherkin(doc) {
        if (!doc.feature)
            return;
        const uri = doc.uri ?? 'unknown.feature';
        this.featuresByUri.set(uri, { name: doc.feature.name, uri });
        for (const child of doc.feature.children ?? []) {
            if (child.scenario?.id) {
                this.featureNameByScenarioAstId.set(child.scenario.id, doc.feature.name);
            }
        }
    }
    featureNameForPickle(pickle) {
        for (const astId of pickle.astNodeIds ?? []) {
            const name = this.featureNameByScenarioAstId.get(astId);
            if (name)
                return name;
        }
        return undefined;
    }
}
exports.EventStorage = EventStorage;
