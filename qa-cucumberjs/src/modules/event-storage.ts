import type {
  Attachment,
  Envelope,
  GherkinDocument,
  Pickle,
  TestCase,
  TestCaseFinished,
  TestCaseStarted,
  TestStepFinished,
  Timestamp,
} from '@cucumber/messages';

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

function durationMs(ts?: { seconds?: number | string; nanos?: number }): number {
  if (!ts) return 0;
  const seconds = Number(ts.seconds ?? 0);
  const nanos = Number(ts.nanos ?? 0);
  return seconds * 1000 + Math.round(nanos / 1e6);
}

function timestampMs(ts: Timestamp | undefined): number {
  if (!ts) return Date.now();
  const seconds = Number(ts.seconds ?? 0);
  const nanos = Number(ts.nanos ?? 0);
  return seconds * 1000 + Math.round(nanos / 1e6);
}

function toStoredAttachment(attachment: Attachment): StoredAttachment {
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
export class EventStorage {
  private readonly featuresByUri = new Map<string, FeatureInfo>();
  private readonly pickles = new Map<string, Pickle>();
  private readonly testCases = new Map<string, TestCase>();
  private readonly testCaseStarts = new Map<string, TestCaseStarted>();
  private readonly stepFinishedByTestStepId = new Map<string, TestStepFinished>();
  private readonly featureNameByScenarioAstId = new Map<string, string>();
  private readonly attachmentsByStartedId = new Map<string, StoredAttachment[]>();

  ingest(envelope: Envelope): void {
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
      this.testCaseStarts.set(
        envelope.testCaseStarted.id,
        envelope.testCaseStarted,
      );
      return;
    }
    if (envelope.testStepFinished) {
      this.stepFinishedByTestStepId.set(
        envelope.testStepFinished.testStepId,
        envelope.testStepFinished,
      );
      return;
    }
    if (envelope.attachment) {
      this.addAttachment(envelope.attachment);
    }
  }

  convertFinished(finished: TestCaseFinished): ConvertedScenario | undefined {
    const started = this.testCaseStarts.get(finished.testCaseStartedId);
    if (!started) return undefined;

    const testCase = this.testCases.get(started.testCaseId);
    if (!testCase) return undefined;

    const pickle = this.pickles.get(testCase.pickleId);
    if (!pickle) return undefined;

    const uri = pickle.uri ?? 'unknown.feature';
    const feature =
      this.featuresByUri.get(uri)?.name ??
      this.featureNameForPickle(pickle) ??
      'Feature';

    const steps: FinishedStep[] = [];
    const failureMessages: string[] = [];
    let anyFailed = false;
    let anyPending = false;

    for (const testStep of testCase.testSteps ?? []) {
      if (!testStep.pickleStepId) continue; // hook steps
      const finishedStep = this.stepFinishedByTestStepId.get(testStep.id);
      if (!finishedStep) continue;

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
        if (message) failureMessages.push(message);
      } else if (
        status === 'PENDING' ||
        status === 'UNDEFINED' ||
        status === 'SKIPPED'
      ) {
        anyPending = true;
      }
    }

    const startMs = timestampMs(started.timestamp);
    const endMs = timestampMs(finished.timestamp);

    let status: ConvertedScenario['status'] = 'passed';
    if (anyFailed) status = 'failed';
    else if (anyPending && steps.every((s) => s.status !== 'PASSED')) {
      status = 'pending';
    } else if (anyPending && !anyFailed) {
      // Background skips alone — treat as passed if at least one passed step
      status = steps.some((s) => s.status === 'PASSED') ? 'passed' : 'pending';
    }

    const attachments =
      this.attachmentsByStartedId.get(finished.testCaseStartedId) ?? [];
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

  private addAttachment(attachment: Attachment): void {
    const startedId = attachment.testCaseStartedId;
    if (!startedId) return;
    const list = this.attachmentsByStartedId.get(startedId) ?? [];
    list.push(toStoredAttachment(attachment));
    this.attachmentsByStartedId.set(startedId, list);
  }

  private addGherkin(doc: GherkinDocument): void {
    if (!doc.feature) return;
    const uri = doc.uri ?? 'unknown.feature';
    this.featuresByUri.set(uri, { name: doc.feature.name, uri });

    for (const child of doc.feature.children ?? []) {
      if (child.scenario?.id) {
        this.featureNameByScenarioAstId.set(child.scenario.id, doc.feature.name);
      }
    }
  }

  private featureNameForPickle(pickle: Pickle): string | undefined {
    for (const astId of pickle.astNodeIds ?? []) {
      const name = this.featureNameByScenarioAstId.get(astId);
      if (name) return name;
    }
    return undefined;
  }
}
