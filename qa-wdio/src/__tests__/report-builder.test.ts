import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { qaDescribe, qaItAuto, expect } from '@qa/test';

import { qaMetaFromEntries } from '@qanalyzer/forge-commons';

import {
  toJestJsonReport,
  type WdioSpecInput,
} from '../report-builder.js';

type FixtureAssertion = {
  ancestorTitles: string[];
  title: string;
  status: 'passed' | 'failed' | 'pending' | 'todo';
  duration?: number;
  steps?: string[];
  ignore?: boolean;
};

type FixtureFile = {
  specs: Array<{
    name: string;
    assertions: FixtureAssertion[];
  }>;
};

function loadSaucedemoFixture(): WdioSpecInput[] {
  const raw = JSON.parse(
    readFileSync(join(__dirname, '../__fixtures__/saucedemo-13.json'), 'utf8'),
  ) as FixtureFile;

  return raw.specs.map((spec) => ({
    name: spec.name,
    assertions: spec.assertions.map((a) => {
      const entries: Array<{ type: string; body: unknown }> = [];
      for (const step of a.steps ?? []) {
        entries.push({ type: 'qa-step-start', body: step });
        entries.push({ type: 'qa-step-end', body: { name: step, status: 'passed' } });
      }
      if (a.ignore) {
        entries.push({ type: 'qa-ignore', body: true });
      }
      const wire = qaMetaFromEntries(entries, {
        framework: 'wdio',
        reporter: '@qanalyzer/forge-wdio',
      });
      return {
        ancestorTitles: a.ancestorTitles,
        title: a.title,
        status: a.status,
        duration: a.duration,
        failureMessages: [],
        meta: wire ? { qa: wire } : undefined,
      };
    }),
  }));
}

qaDescribe('toJestJsonReport (FR124 / FR134)', () => {
  qaItAuto('normalizes saucedemo fixture to 13 tests with AUTH keys and steps', () => {
    const specs = loadSaucedemoFixture();
    const report = toJestJsonReport(specs, 1_700_000_000_000);

    expect(report.numTotalTests).toBe(13);
    expect(report.numPassedTests).toBe(12);
    expect(report.numPendingTests).toBe(1);
    expect(report.success).toBe(true);
    expect(report.testResults?.length).toBe(4);

    const titles = (report.testResults ?? []).flatMap(
      (f) => (f.assertionResults ?? []).map((a) => a.title),
    );
    expect(titles.some((t) => t?.includes('AUTH-101'))).toBeTruthy();
    expect(titles.some((t) => t?.includes('AUTH-113'))).toBeTruthy();

    const login = report.testResults?.[0]?.assertionResults?.[0];
    const loginQa = login?.meta?.qa as
      | { framework?: string; steps?: unknown[] }
      | undefined;
    expect(loginQa?.framework).toBe('wdio');
    expect((loginQa?.steps?.length ?? 0) >= 1).toBeTruthy();

    const ignored = report.testResults
      ?.flatMap((f) => f.assertionResults ?? [])
      .find((a) => a.title?.includes('AUTH-113'));
    const ignoredQa = ignored?.meta?.qa as { ignore?: boolean } | undefined;
    expect(ignoredQa?.ignore).toBe(true);
  });
});

qaDescribe('qa.step → meta.qa.steps (FR125)', () => {
  qaItAuto('preserves nested step order via qaMetaFromEntries', () => {
    const wire = qaMetaFromEntries(
      [
        { type: 'qa-step-start', body: 'outer' },
        { type: 'qa-step-start', body: 'inner' },
        { type: 'qa-step-end', body: { name: 'inner', status: 'passed' } },
        { type: 'qa-step-end', body: { name: 'outer', status: 'passed' } },
        { type: 'qa-suite', body: 'E-commerce\tLogin' },
      ],
      { framework: 'wdio', reporter: '@qanalyzer/forge-wdio' },
    );
    expect(wire).toBeTruthy();
    expect(wire?.framework).toBe('wdio');
    expect(wire?.steps?.length).toBe(2);
    expect(wire?.steps?.[0]?.name).toBe('outer');
    expect(wire?.steps?.[1]?.name).toBe('inner');
    expect(wire?.suite).toEqual([{ title: 'E-commerce' }, { title: 'Login' }]);
  });
});
