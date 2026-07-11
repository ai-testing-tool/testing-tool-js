/**
 * Programmatic helpers for Vitest tests (FR98).
 * Prefer Jira issue keys in test titles; use these for suite/fields/steps metadata.
 */

type StepFn = () => Promise<void> | void;

type AnnotateFn = (message: string, options?: { type?: string; body?: unknown }) => Promise<void>;

export type QaHelpers = {
  title(value: string): Promise<void>;
  comment(value: string): Promise<void>;
  suite(value: string): Promise<void>;
  fields(values: Record<string, string>): Promise<void>;
  parameters(values: Record<string, string>): Promise<void>;
  ignore(): void;
  step(name: string, body: StepFn): Promise<void>;
  attach(attach: { name?: string; type?: string; content?: string }): Promise<void>;
};

export type QaTestContext = {
  qa: QaHelpers;
  annotate: AnnotateFn;
};

function createQaHelpers(annotate: AnnotateFn): QaHelpers {
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
    ignore() {
      // Sync only — marks intent; runner skip is still the caller's responsibility
    },
    async step(name: string, body: StepFn) {
      await annotate(`QA Step: ${name}`, { type: 'qa-step', body: name });
      await body();
    },
    async attach(attach) {
      await annotate(`QA Attach: ${attach.name ?? 'file'}`, {
        type: 'qa-attach',
        body: { name: attach.name, type: attach.type },
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

    const qa = createQaHelpers(annotate);
    await fn({ ...ctx, qa, annotate });
  };
}

/** Standalone helpers when not using withQa (no-op annotate). */
export const qa: QaHelpers = createQaHelpers(async () => undefined);
