import {
  createQaMetaAccumulator,
  applyQaAnnotation,
  toQaMetaWire,
  type QaMetaWire,
} from 'qa-forge-commons';

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
  fields?: Record<string, string>;
  parameters?: Record<string, string>;
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
      if (message.fields) {
        applyQaAnnotation(acc, { type: 'qa-fields', body: message.fields });
      }
      if (message.parameters) {
        applyQaAnnotation(acc, { type: 'qa-parameters', body: message.parameters });
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

  return toQaMetaWire(acc, { framework: 'playwright', reporter: 'qa-forge-playwright' });
}
