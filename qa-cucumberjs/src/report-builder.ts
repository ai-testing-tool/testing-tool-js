import type {
  JestAssertionResult,
  JestTestFileResult,
  JestVitestJsonReport,
  QaMetaWire,
} from '@qanalyzer/forge-commons';
import {
  qaMetaFromEntries,
  uploadAttachmentForQa,
} from '@qanalyzer/forge-commons';

import type {
  ConvertedScenario,
  StoredAttachment,
} from './modules/event-storage';
import {
  parseQaTags,
  resolveScenarioTitle,
} from './modules/tag-parser';

export type CucumberAssertionInput = {
  ancestorTitles: string[];
  title: string;
  fullName?: string;
  status: 'passed' | 'failed' | 'pending' | 'todo';
  duration?: number;
  failureMessages?: string[];
  meta?: { qa?: QaMetaWire };
};

export type CucumberSpecInput = {
  name: string;
  startTime?: number;
  endTime?: number;
  assertions: CucumberAssertionInput[];
};

function mapStepStatus(
  status: string,
): 'passed' | 'failed' | 'skipped' {
  if (status === 'FAILED' || status === 'AMBIGUOUS') return 'failed';
  if (status === 'PASSED') return 'passed';
  return 'skipped';
}

function decodeAttachmentBody(
  body: string,
  contentEncoding: string,
): Buffer {
  const encoding = contentEncoding.toUpperCase();
  if (encoding === 'BASE64') {
    return Buffer.from(body, 'base64');
  }
  return Buffer.from(body, 'utf8');
}

function defaultFileName(att: StoredAttachment, index: number): string {
  if (att.fileName) return att.fileName;
  const subtype = att.mediaType.split('/')[1];
  if (subtype && /^[a-z0-9.+-]+$/i.test(subtype)) {
    return `attachment-${index + 1}.${subtype}`;
  }
  return `attachment-${index + 1}.bin`;
}

/**
 * Upload Cucumber attachments (FR58). Never throws — missing key / oversize /
 * config → metadata-only wire entries.
 */
export async function uploadScenarioAttachments(
  scenario: ConvertedScenario,
  title: string,
  tagIssueKeys: readonly string[],
): Promise<Array<{ type: string; body: unknown }>> {
  const entries: Array<{ type: string; body: unknown }> = [];
  const issueKeySources = [
    ...tagIssueKeys,
    title,
    scenario.title,
    scenario.pickle.name,
    ...(scenario.pickle.tags ?? []).map((t) => t.name),
  ];

  for (let i = 0; i < scenario.attachments.length; i += 1) {
    const att = scenario.attachments[i]!;
    try {
      const content = decodeAttachmentBody(att.body, att.contentEncoding);
      const fileName = defaultFileName(att, i);
      const outcome = await uploadAttachmentForQa({
        fileName,
        mimeType: att.mediaType,
        content,
        issueKey: tagIssueKeys[0],
        issueKeySources,
      });
      entries.push({
        type: 'qa-attach',
        body: {
          name: outcome.attachment.file_name ?? fileName,
          contentType: outcome.attachment.mime_type ?? att.mediaType,
          size: outcome.attachment.size,
          content_ref: outcome.attachment.content_ref,
        },
      });
    } catch {
      entries.push({
        type: 'qa-attach',
        body: {
          name: defaultFileName(att, i),
          contentType: att.mediaType,
        },
      });
    }
  }
  return entries;
}

/**
 * Convert a finished Cucumber scenario into one FR41 assertion (or null if @QaIgnore).
 * Pass pre-built attachEntries from {@link uploadScenarioAttachments} when available.
 */
export function scenarioToAssertion(
  scenario: ConvertedScenario,
  attachEntries: Array<{ type: string; body: unknown }> = [],
): CucumberAssertionInput | null {
  const tagMeta = parseQaTags(scenario.pickle.tags ?? []);
  if (tagMeta.ignore) return null;

  const title = resolveScenarioTitle(scenario.title, tagMeta);
  const ancestors =
    tagMeta.suite && tagMeta.suite.length > 0
      ? tagMeta.suite.split('\t').map((s) => s.trim()).filter(Boolean)
      : [scenario.featureName];

  const entries: Array<{ type: string; body: unknown }> = [];
  if (tagMeta.suite) {
    entries.push({ type: 'qa-suite', body: tagMeta.suite });
  }
  if (Object.keys(tagMeta.fields).length > 0) {
    entries.push({ type: 'qa-fields', body: tagMeta.fields });
  }
  if (Object.keys(tagMeta.parameters).length > 0) {
    entries.push({ type: 'qa-parameters', body: tagMeta.parameters });
  }
  if (tagMeta.title) {
    entries.push({ type: 'qa-title', body: tagMeta.title });
  }
  if (tagMeta.issueKeys.length > 0) {
    entries.push({ type: 'qa-issue-keys', body: tagMeta.issueKeys });
  }

  for (const step of scenario.steps) {
    entries.push({ type: 'qa-step', body: step.text });
    const stepStatus = mapStepStatus(step.status);
    if (stepStatus === 'failed') {
      entries.push({
        type: 'qa-step-failed',
        body: { name: step.text, status: 'failed' },
      });
    } else {
      entries.push({
        type: 'qa-step-end',
        body: { name: step.text, status: stepStatus },
      });
    }
  }

  entries.push(...attachEntries);

  const wire = qaMetaFromEntries(entries, {
    framework: 'cucumberjs',
    reporter: '@qanalyzer/forge-cucumberjs',
  });

  const assertion: CucumberAssertionInput = {
    ancestorTitles: ancestors,
    title,
    fullName:
      ancestors.length > 0 ? `${ancestors.join(' ')} ${title}` : title,
    status: scenario.status,
    duration: scenario.durationMs,
    failureMessages: scenario.failureMessages,
  };
  if (wire) {
    assertion.meta = { qa: wire };
  }
  return assertion;
}

/**
 * Build assertion including Phase 3 attachment upload (FR58).
 */
export async function scenarioToAssertionAsync(
  scenario: ConvertedScenario,
): Promise<CucumberAssertionInput | null> {
  const tagMeta = parseQaTags(scenario.pickle.tags ?? []);
  if (tagMeta.ignore) return null;
  const title = resolveScenarioTitle(scenario.title, tagMeta);
  const attachEntries = await uploadScenarioAttachments(
    scenario,
    title,
    tagMeta.issueKeys,
  );
  return scenarioToAssertion(scenario, attachEntries);
}

function mapAssertion(a: CucumberAssertionInput): JestAssertionResult {
  const assertion: JestAssertionResult = {
    ancestorTitles: a.ancestorTitles,
    fullName:
      a.fullName ??
      (a.ancestorTitles.length > 0
        ? `${a.ancestorTitles.join(' ')} ${a.title}`
        : a.title),
    title: a.title,
    status: a.status,
    duration: a.duration,
    failureMessages: a.failureMessages ?? [],
  };
  if (a.meta?.qa) {
    assertion.meta = { qa: a.meta.qa };
  }
  return assertion;
}

function fileStatus(assertions: JestAssertionResult[]): string {
  return assertions.some((a) => a.status === 'failed') ? 'failed' : 'passed';
}

/**
 * Normalize Cucumber scenarios into FR41 jest-json shape A (FR50).
 */
export function toJestJsonReport(
  specs: readonly CucumberSpecInput[],
  startTime?: number,
): JestVitestJsonReport {
  const testResults: JestTestFileResult[] = specs.map((spec) => {
    const assertionResults = spec.assertions.map(mapAssertion);
    return {
      name: spec.name,
      status: fileStatus(assertionResults),
      startTime: spec.startTime,
      endTime: spec.endTime,
      assertionResults,
    };
  });

  let numPassedTests = 0;
  let numFailedTests = 0;
  let numPendingTests = 0;
  let numTodoTests = 0;

  for (const file of testResults) {
    for (const a of file.assertionResults ?? []) {
      if (a.status === 'passed') numPassedTests += 1;
      else if (a.status === 'failed') numFailedTests += 1;
      else if (a.status === 'todo') numTodoTests += 1;
      else numPendingTests += 1;
    }
  }

  const numTotalTests =
    numPassedTests + numFailedTests + numPendingTests + numTodoTests;
  const numFailedTestSuites = testResults.filter((t) => t.status === 'failed')
    .length;
  const numPassedTestSuites = testResults.length - numFailedTestSuites;

  return {
    numTotalTestSuites: testResults.length,
    numPassedTestSuites,
    numFailedTestSuites,
    numPendingTestSuites: 0,
    numTotalTests,
    numPassedTests,
    numFailedTests,
    numPendingTests,
    numTodoTests,
    startTime,
    success: numFailedTests === 0,
    testResults,
  };
}

/** Group assertions by feature URI. */
export function specsFromAssertions(
  assertionsByUri: Map<string, CucumberAssertionInput[]>,
  runStart: number,
  runEnd: number,
): CucumberSpecInput[] {
  const specs: CucumberSpecInput[] = [];
  for (const [name, assertions] of assertionsByUri) {
    if (assertions.length === 0) continue;
    specs.push({
      name,
      startTime: runStart,
      endTime: runEnd,
      assertions,
    });
  }
  return specs;
}
