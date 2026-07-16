/**
 * Programmatic helpers for Mocha tests (FR86 / NFR26 + Phase 3 FR94 attach upload).
 */

import { uploadAttachmentForQa } from '@qanalyzer/forge-commons';

type StepFn = () => Promise<void> | void;

export type QaAttachInput = {
  name?: string;
  contentType?: string;
  type?: string;
  content?: string | Buffer | Uint8Array;
  path?: string;
  issueKey?: string;
};

export type QaHelpers = {
  title(value: string): void;
  comment(value: string): void;
  suite(value: string): void;
  fields(values: Record<string, string>): void;
  parameters(values: Record<string, string>): void;
  /** Explicit FR43 issue key (preferred over embedding in titles). */
  issueKey(key: string): void;
  /** Explicit FR43 issue keys (preferred over embedding in titles). */
  issueKeys(keys: string[]): void;
  ignore(): void;
  step(name: string, body: StepFn): void | Promise<void>;
  /** Sync metadata-only when no content; returns Promise when uploading. */
  attach(attach: QaAttachInput): void | Promise<void>;
};

export type QaMetaEntry = {
  type: string;
  body: unknown;
};

export type QaMochaBridge = {
  push(entry: QaMetaEntry): void;
  drain(): QaMetaEntry[];
  currentTitle?: string;
};

declare global {
  // eslint-disable-next-line no-var
  var __QA_MOCHA_BRIDGE__: QaMochaBridge | undefined;
}

const localBuffer: QaMetaEntry[] = [];

function pushMeta(type: string, body: unknown): void {
  const entry = { type, body };
  if (globalThis.__QA_MOCHA_BRIDGE__) {
    globalThis.__QA_MOCHA_BRIDGE__.push(entry);
    return;
  }
  localBuffer.push(entry);
}

export function drainQaMeta(): QaMetaEntry[] {
  if (globalThis.__QA_MOCHA_BRIDGE__) {
    return globalThis.__QA_MOCHA_BRIDGE__.drain();
  }
  const copy = [...localBuffer];
  localBuffer.length = 0;
  return copy;
}

function isThenable(value: unknown): value is Promise<void> {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Promise<void>).then === 'function'
  );
}

function currentTestTitle(): string | undefined {
  return globalThis.__QA_MOCHA_BRIDGE__?.currentTitle;
}

export const qa: QaHelpers = {
  title(value: string) {
    pushMeta('qa-title', value);
  },
  comment(value: string) {
    pushMeta('qa-comment', value);
  },
  suite(value: string) {
    pushMeta('qa-suite', value);
  },
  fields(values: Record<string, string>) {
    pushMeta('qa-fields', values);
  },
  parameters(values: Record<string, string>) {
    pushMeta('qa-parameters', values);
  },
  issueKey(key: string) {
    pushMeta('qa-issue-key', key);
  },
  issueKeys(keys: string[]) {
    pushMeta('qa-issue-keys', keys);
  },
  ignore() {
    pushMeta('qa-ignore', true);
  },
  step(name: string, body: StepFn) {
    pushMeta('qa-step', name);
    try {
      const result = body();
      if (isThenable(result)) {
        return result.then(
          () => {
            pushMeta('qa-step-end', { name, status: 'passed' });
          },
          (error: unknown) => {
            pushMeta('qa-step-failed', { name, status: 'failed' });
            throw error;
          },
        );
      }
      pushMeta('qa-step-end', { name, status: 'passed' });
    } catch (error) {
      pushMeta('qa-step-failed', { name, status: 'failed' });
      throw error;
    }
  },
  attach(attach) {
    const mime = attach.contentType ?? attach.type;
    const hasBinary = attach.content !== undefined || Boolean(attach.path);
    if (!hasBinary) {
      pushMeta('qa-attach', {
        name: attach.name,
        contentType: mime,
      });
      return;
    }

    return uploadAttachmentForQa({
      fileName: attach.name,
      mimeType: mime,
      content: attach.content,
      path: attach.path,
      issueKey: attach.issueKey,
      issueKeySources: [attach.issueKey, currentTestTitle()],
    }).then((outcome) => {
      pushMeta('qa-attach', {
        name: outcome.attachment.file_name ?? attach.name,
        contentType: outcome.attachment.mime_type ?? mime,
        size: outcome.attachment.size,
        content_ref: outcome.attachment.content_ref,
      });
    });
  },
};
