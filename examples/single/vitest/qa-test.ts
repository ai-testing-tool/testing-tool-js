import { afterAll, beforeAll, describe, expect, it, test } from 'vitest';
import { withQa, type QaTestContext } from '@ai-testing-tool/forge-vitest/vitest';

const suiteStack: string[] = [];

async function applyQaHeader(
  ctx: QaTestContext,
  title: string,
  issueKeys?: string[],
): Promise<void> {
  const suite = suiteStack[suiteStack.length - 1];
  if (suite) await ctx.qa.suite(suite);
  await ctx.qa.title(title);
  if (issueKeys?.length) await ctx.qa.issueKeys(issueKeys);
}

/** Describe block — sets qa-suite for nested qaIt/qaTest calls. */
export function qaDescribe(name: string, fn: () => void): void {
  describe(name, () => {
    beforeAll(() => {
      suiteStack.push(name);
    });
    afterAll(() => {
      suiteStack.pop();
    });
    fn();
  });
}

type QaTestFn = (ctx: QaTestContext) => void | Promise<void>;

function qaItImpl(
  name: string,
  fn: QaTestFn,
  runner: typeof it,
  issueKeys?: string[],
): void {
  runner(
    name,
    withQa(async (ctx) => {
      await applyQaHeader(ctx, name, issueKeys);
      await fn(ctx);
    }),
  );
}

/** Vitest `it` with qa-title and qa-suite; set issue keys via `qa.issueKeys()` in the body. */
export function qaIt(name: string, fn: QaTestFn): void {
  qaItImpl(name, fn, it);
}

qaIt.skip = (name: string, fn: QaTestFn) => qaItImpl(name, fn, it.skip);
qaIt.only = (name: string, fn: QaTestFn) => qaItImpl(name, fn, it.only);

function qaTestImpl(
  name: string,
  fn: QaTestFn,
  runner: typeof test,
  issueKeys?: string[],
): void {
  runner(
    name,
    withQa(async (ctx) => {
      await applyQaHeader(ctx, name, issueKeys);
      await fn(ctx);
    }),
  );
}

/** Vitest `test` with qa-title and qa-suite; set issue keys via `qa.issueKeys()` in the body. */
export function qaTest(name: string, fn: QaTestFn): void {
  qaTestImpl(name, fn, test);
}

qaTest.skip = (name: string, fn: QaTestFn) => qaTestImpl(name, fn, test.skip);
qaTest.only = (name: string, fn: QaTestFn) => qaTestImpl(name, fn, test.only);

/** Prefix for auto issue keys — set per Vitest project (e.g. AUTH-6 → AUTH-601). */
const issuePrefix = process.env.QA_ISSUE_PREFIX ?? 'AUTH-9';
let autoIssueCounter = 0;

function nextAutoIssueKey(): string {
  autoIssueCounter += 1;
  return `${issuePrefix}${String(autoIssueCounter).padStart(2, '0')}`;
}

/** `it` with qa metadata, auto issue key, and a single qa-step wrapping the test body. */
export function qaItAuto(name: string, fn: () => void | Promise<void>): void {
  qaItImpl(name, async ({ qa }) => qa.step('run', fn), it, [nextAutoIssueKey()]);
}

qaItAuto.skip = (name: string, fn: () => void | Promise<void>) => {
  qaItImpl(name, async ({ qa }) => qa.step('run', fn), it.skip, [nextAutoIssueKey()]);
};

qaItAuto.only = (name: string, fn: () => void | Promise<void>) => {
  qaItImpl(name, async ({ qa }) => qa.step('run', fn), it.only, [nextAutoIssueKey()]);
};

/** `test` with qa metadata, auto issue key, and a single qa-step wrapping the test body. */
export function qaTestAuto(name: string, fn: () => void | Promise<void>): void {
  qaTestImpl(name, async ({ qa }) => qa.step('run', fn), test, [nextAutoIssueKey()]);
}

export type { QaTestContext };
export { expect };
