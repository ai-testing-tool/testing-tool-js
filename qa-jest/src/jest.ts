/**
 * Programmatic helpers for Jest tests (FR75).
 * Prefer Jira issue keys in test titles; use these for suite/fields/steps metadata.
 */

type StepFn = () => Promise<void> | void;

export type QaHelpers = {
  title(value: string): Promise<void>;
  comment(value: string): Promise<void>;
  suite(value: string): Promise<void>;
  fields(values: Record<string, string>): Promise<void>;
  parameters(values: Record<string, string>): Promise<void>;
  ignore(): void;
  step(name: string, body: StepFn): Promise<void>;
  attach(attach: {
    name?: string;
    contentType?: string;
    type?: string;
    content?: string;
  }): Promise<void>;
};

type QaMetaEntry = {
  type: string;
  body: unknown;
};

/** In-memory buffer for future meta.qa enrichment (scaffold: collect only). */
const metaBuffer: QaMetaEntry[] = [];

export function drainQaMeta(): QaMetaEntry[] {
  const copy = [...metaBuffer];
  metaBuffer.length = 0;
  return copy;
}

function pushMeta(type: string, body: unknown): void {
  metaBuffer.push({ type, body });
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
  ignore() {
    pushMeta('qa-ignore', true);
  },
  async step(name: string, body: StepFn) {
    pushMeta('qa-step', name);
    await body();
  },
  async attach(attach) {
    pushMeta('qa-attach', {
      name: attach.name,
      contentType: attach.contentType ?? attach.type,
    });
  },
};
