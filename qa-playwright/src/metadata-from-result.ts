import {
  createQaMetaAccumulator,
  applyQaAnnotation,
  toQaMetaWire,
  type QaMetaWire,
} from '@ai-testing-tool/forge-commons';

import { QA_METADATA_CONTENT_TYPE } from './metadata-manager';
import type { PlaywrightStepLike } from './step-extractor';
import { extractNativeSteps } from './step-extractor';

export type PlaywrightAttachmentLike = {
  name: string;
  contentType: string;
  body?: Buffer | string;
  /** Disk path when Playwright wrote the attachment to a file. */
  path?: string;
};

type MetadataMessage = {
  title?: string;
  comment?: string;
  suite?: string;
  suiteId?: string;
  planId?: string;
  planName?: string;
  fixVersion?: string;
  sprintName?: string;
  labels?: string | string[];
  fields?: Record<string, string>;
  parameters?: Record<string, string>;
  issueKeys?: string[];
  ignore?: boolean;
  attachments?: Array<{ name?: string; contentType?: string }>;
};

/**
 * Merge `qa.*` helper attachments + native `test.step` into `meta.qa`.
 */
export function buildQaMetaFromResult(input: {
  attachments?: readonly PlaywrightAttachmentLike[];
  steps?: readonly PlaywrightStepLike[];
}): QaMetaWire | undefined {
  const acc = createQaMetaAccumulator();

  for (const attachment of input.attachments ?? []) {
    if (attachment.contentType !== QA_METADATA_CONTENT_TYPE) continue;
    if (attachment.body == null) continue;
    try {
      const raw =
        typeof attachment.body === 'string'
          ? attachment.body
          : attachment.body.toString('utf8');
      const message = JSON.parse(raw) as MetadataMessage;
      if (message.title) applyQaAnnotation(acc, { type: 'qa-title', body: message.title });
      if (message.comment) {
        applyQaAnnotation(acc, { type: 'qa-comment', body: message.comment });
      }
      if (message.suite) applyQaAnnotation(acc, { type: 'qa-suite', body: message.suite });
      if (message.suiteId) {
        applyQaAnnotation(acc, { type: 'qa-suite-id', body: message.suiteId });
      }
      if (message.planId) {
        applyQaAnnotation(acc, { type: 'qa-plan-id', body: message.planId });
      }
      if (message.planName) {
        applyQaAnnotation(acc, { type: 'qa-plan', body: message.planName });
      }
      if (message.fixVersion) {
        applyQaAnnotation(acc, { type: 'qa-fix-version', body: message.fixVersion });
      }
      if (message.sprintName) {
        applyQaAnnotation(acc, { type: 'qa-sprint-name', body: message.sprintName });
      }
      if (message.labels !== undefined && message.labels !== null) {
        applyQaAnnotation(acc, { type: 'qa-labels', body: message.labels });
      }
      if (message.fields) {
        applyQaAnnotation(acc, { type: 'qa-fields', body: message.fields });
      }
      if (message.parameters) {
        applyQaAnnotation(acc, { type: 'qa-parameters', body: message.parameters });
      }
      if (message.issueKeys?.length) {
        applyQaAnnotation(acc, { type: 'qa-issue-keys', body: message.issueKeys });
      }
      if (message.ignore) applyQaAnnotation(acc, { type: 'qa-ignore', body: true });
      for (const att of message.attachments ?? []) {
        applyQaAnnotation(acc, {
          type: 'qa-attach',
          body: { name: att.name, contentType: att.contentType },
        });
      }
    } catch {
      // ignore malformed metadata
    }
  }

  const nativeSteps = extractNativeSteps(input.steps);
  for (const step of nativeSteps) {
    acc.steps.push({ name: step.name, status: step.status });
  }

  return toQaMetaWire(acc, { framework: 'playwright', reporter: '@ai-testing-tool/forge-playwright' });
}
