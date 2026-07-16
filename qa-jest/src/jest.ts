/**
 * Programmatic helpers for Jest tests (FR75 + Phase 3 attach upload FR83).
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
  title(value: string): Promise<void>;
  comment(value: string): Promise<void>;
  suite(value: string): Promise<void>;
  fields(values: Record<string, string>): Promise<void>;
  parameters(values: Record<string, string>): Promise<void>;
  /** Explicit FR43 issue key (preferred over embedding in titles). */
  issueKey(key: string): Promise<void>;
  /** Explicit FR43 issue keys (preferred over embedding in titles). */
  issueKeys(keys: string[]): Promise<void>;
  ignore(): void;
  step(name: string, body: StepFn): Promise<void>;
  attach(attach: QaAttachInput): Promise<void>;
};

export type QaMetaEntry = {
  type: string;
  body: unknown;
};

export type QaJestBridge = {
  push(entry: QaMetaEntry): void;
  drain(): QaMetaEntry[];
  currentTitle?: string;
};

declare global {
  // eslint-disable-next-line no-var
  var __QA_JEST_BRIDGE__: QaJestBridge | undefined;
}

const localBuffer: QaMetaEntry[] = [];

function pushMeta(type: string, body: unknown): void {
  const entry = { type, body };
  if (globalThis.__QA_JEST_BRIDGE__) {
    globalThis.__QA_JEST_BRIDGE__.push(entry);
    return;
  }
  localBuffer.push(entry);
}

export function drainQaMeta(): QaMetaEntry[] {
  if (globalThis.__QA_JEST_BRIDGE__) {
    return globalThis.__QA_JEST_BRIDGE__.drain();
  }
  const copy = [...localBuffer];
  localBuffer.length = 0;
  return copy;
}

function currentTestTitle(): string | undefined {
  return globalThis.__QA_JEST_BRIDGE__?.currentTitle;
}

export const qa: QaHelpers = {
  async title(value: string) {
    pushMeta('qa-title', value);
  },
  async comment(value: string) {
    pushMeta('qa-comment', value);
  },
  async suite(value: string) {
    pushMeta('qa-suite', value);
  },
  async fields(values: Record<string, string>) {
    pushMeta('qa-fields', values);
  },
  async parameters(values: Record<string, string>) {
    pushMeta('qa-parameters', values);
  },
  async issueKey(key: string) {
    pushMeta('qa-issue-key', key);
  },
  async issueKeys(keys: string[]) {
    pushMeta('qa-issue-keys', keys);
  },
  ignore() {
    pushMeta('qa-ignore', true);
  },
  async step(name: string, body: StepFn) {
    pushMeta('qa-step', name);
    try {
      await body();
      pushMeta('qa-step-end', { name, status: 'passed' });
    } catch (error) {
      pushMeta('qa-step-failed', { name, status: 'failed' });
      throw error;
    }
  },
  async attach(attach) {
    const mime = attach.contentType ?? attach.type;
    const outcome = await uploadAttachmentForQa({
      fileName: attach.name,
      mimeType: mime,
      content: attach.content,
      path: attach.path,
      issueKey: attach.issueKey,
      issueKeySources: [attach.issueKey, currentTestTitle()],
    });
    pushMeta('qa-attach', {
      name: outcome.attachment.file_name ?? attach.name,
      contentType: outcome.attachment.mime_type ?? mime,
      size: outcome.attachment.size,
      content_ref: outcome.attachment.content_ref,
    });
  },
};
