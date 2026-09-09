/**
 * Programmatic helpers for Vitest tests (FR98 + Phase 3 FR107 attach upload).
 */

import { uploadAttachmentForQa } from '@ai-testing-tool/forge-commons';

type StepFn = () => Promise<void> | void;

type AnnotateFn = (message: string, options?: { type?: string; body?: unknown }) => Promise<void>;

export type QaAttachInput = {
  name?: string;
  type?: string;
  contentType?: string;
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

export type QaTestContext = {
  qa: QaHelpers;
  annotate: AnnotateFn;
};

function vitestCurrentTitle(ctx?: Record<string, unknown>): string | undefined {
  const task = ctx?.task as { name?: string; fullName?: string } | undefined;
  if (task?.fullName) return task.fullName;
  if (task?.name) return task.name;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { expect } = require('vitest') as {
      expect?: { getState?: () => { currentTestName?: string } };
    };
    return expect?.getState?.()?.currentTestName;
  } catch {
    return undefined;
  }
}

function createQaHelpers(
  annotate: AnnotateFn,
  titleSources: () => Array<string | null | undefined>,
): QaHelpers {
  return {
    async title(value: string) {
      await annotate(`QA Title: ${value}`, { type: 'qa-title', body: value });
    },
    async comment(value: string) {
      await annotate(`QA Comment: ${value}`, { type: 'qa-comment', body: value });
    },
    async suite(value: string) {
      await annotate(`QA Suite: ${value}`, { type: 'qa-suite', body: value });
    },
    async fields(values: Record<string, string>) {
      await annotate(`QA Fields: ${JSON.stringify(values)}`, {
        type: 'qa-fields',
        body: values,
      });
    },
    async parameters(values: Record<string, string>) {
      await annotate(`QA Parameters: ${JSON.stringify(values)}`, {
        type: 'qa-parameters',
        body: values,
      });
    },
    async issueKey(key: string) {
      await annotate(`QA IssueKey: ${key}`, { type: 'qa-issue-key', body: key });
    },
    async issueKeys(keys: string[]) {
      await annotate(`QA IssueKeys: ${keys.join(',')}`, {
        type: 'qa-issue-keys',
        body: keys,
      });
    },
    ignore() {
      // Sync only
    },
    async step(name: string, body: StepFn) {
      await annotate(`QA Step: ${name}`, { type: 'qa-step', body: name });
      try {
        await body();
        await annotate(`QA Step End: ${name}`, {
          type: 'qa-step-end',
          body: { name, status: 'passed' },
        });
      } catch (error) {
        await annotate(`QA Step Failed: ${name}`, {
          type: 'qa-step-failed',
          body: { name, status: 'failed' },
        });
        throw error;
      }
    },
    async attach(attach) {
      const mime = attach.type ?? attach.contentType;
      const outcome = await uploadAttachmentForQa({
        fileName: attach.name,
        mimeType: mime,
        content: attach.content,
        path: attach.path,
        issueKey: attach.issueKey,
        issueKeySources: [attach.issueKey, ...titleSources()],
      });
      await annotate(`QA Attach: ${outcome.attachment.file_name ?? attach.name ?? 'file'}`, {
        type: 'qa-attach',
        body: {
          name: outcome.attachment.file_name ?? attach.name,
          type: outcome.attachment.mime_type ?? mime,
          size: outcome.attachment.size,
          content_ref: outcome.attachment.content_ref,
        },
      });
    },
  };
}

type VitestTestFn = (ctx: QaTestContext & Record<string, unknown>) => Promise<void> | void;

/**
 * Wrap a Vitest test body to inject `qa` helpers (uses Vitest `annotate` when present).
 */
export function withQa(fn: VitestTestFn): VitestTestFn {
  return async (ctx) => {
    const annotate: AnnotateFn =
      typeof ctx.annotate === 'function'
        ? (ctx.annotate as AnnotateFn)
        : async () => undefined;

    const qa = createQaHelpers(annotate, () => [vitestCurrentTitle(ctx)]);
    await fn({ ...ctx, qa, annotate });
  };
}

/** Standalone helpers when not using withQa (no-op annotate). */
export const qa: QaHelpers = createQaHelpers(async () => undefined, () => [
  vitestCurrentTitle(),
]);
