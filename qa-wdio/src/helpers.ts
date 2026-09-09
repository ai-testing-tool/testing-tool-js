/**
 * Programmatic helpers for WebdriverIO Mocha specs (FR125–FR126).
 * Prefer `qa.issueKey()` / `qa.issueKeys()` for FR43 (do not embed keys in titles).
 *
 * Steps: `await qa.step('name', async (step) => { await step.step('nested', ...) })`.
 *
 * `qa.attach({ type })` — use **type** (not contentType). With content/paths,
 * attempts Forge upload (FR133).
 */

import { uploadAttachmentForQa } from '@ai-testing-tool/forge-commons';

import { MetadataManager } from './metadata-manager';

export type QaStepFn = (step: QaStepApi) => void | Promise<void>;

export type QaStepApi = {
  step(name: string, body: QaStepFn): Promise<void>;
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
  /** Async step with nested `step.step()` (FR125). */
  step(name: string, body: QaStepFn): Promise<void>;
  /** Use `type` (FR126); with content/paths uploads via Forge (FR133). */
  attach(attach: {
    name?: string;
    type?: string;
    content?: string | Buffer;
    paths?: string[];
    path?: string;
    issueKey?: string;
  }): void | Promise<void>;
};

function push(type: string, body: unknown): void {
  MetadataManager.push(type, body);
}

function currentTitle(): string | undefined {
  try {
    // Mocha context title when available
    const g = globalThis as { currentTest?: { title?: string } };
    return g.currentTest?.title;
  } catch {
    return undefined;
  }
}

async function runStep(name: string, body: QaStepFn): Promise<void> {
  push('qa-step-start', name);
  const api: QaStepApi = {
    step(nestedName, nestedBody) {
      return runStep(nestedName, nestedBody);
    },
  };
  try {
    await body(api);
    push('qa-step-end', { name, status: 'passed' });
  } catch (err) {
    push('qa-step-end', { name, status: 'failed' });
    throw err;
  }
}

export const qa: QaHelpers = {
  title(value: string) {
    push('qa-title', value);
  },
  comment(value: string) {
    push('qa-comment', value);
  },
  suite(value: string) {
    push('qa-suite', value);
  },
  fields(values: Record<string, string>) {
    push('qa-fields', values);
  },
  parameters(values: Record<string, string>) {
    push('qa-parameters', values);
  },
  issueKey(key: string) {
    push('qa-issue-key', key);
  },
  issueKeys(keys: string[]) {
    push('qa-issue-keys', keys);
  },
  ignore() {
    push('qa-ignore', true);
  },
  step(name: string, body: QaStepFn) {
    return runStep(name, body);
  },
  attach(attach) {
    const mime = attach.type;
    const path = attach.path ?? attach.paths?.[0];
    const hasBinary = attach.content !== undefined || Boolean(path);
    if (!hasBinary) {
      push('qa-attach', {
        name: attach.name,
        type: mime,
      });
      return;
    }

    return uploadAttachmentForQa({
      fileName: attach.name,
      mimeType: mime,
      content: attach.content,
      path,
      issueKey: attach.issueKey,
      issueKeySources: [attach.issueKey, currentTitle()],
    })
      .then((outcome) => {
        push('qa-attach', {
          name: outcome.attachment.file_name ?? attach.name,
          type: outcome.attachment.mime_type ?? mime,
          size: outcome.attachment.size,
          content_ref: outcome.attachment.content_ref,
        });
      })
      .catch(() => {
        push('qa-attach', {
          name: attach.name,
          type: mime,
        });
      });
  },
};

export { MetadataManager };
export type { QaMetaEntry } from './metadata-manager';
