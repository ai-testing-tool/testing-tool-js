import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import { qaMetaFromEntries } from 'qa-javascript-commons';

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
        reporter: 'qa-wdio',
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

describe('toJestJsonReport (FR124 / FR134)', () => {
  it('normalizes saucedemo fixture to 13 tests with AUTH keys and steps', () => {
    const specs = loadSaucedemoFixture();
    const report = toJestJsonReport(specs, 1_700_000_000_000);

    assert.equal(report.numTotalTests, 13);
    assert.equal(report.numPassedTests, 12);
    assert.equal(report.numPendingTests, 1);
    assert.equal(report.success, true);
    assert.equal(report.testResults?.length, 4);

    const titles = (report.testResults ?? []).flatMap(
      (f) => (f.assertionResults ?? []).map((a) => a.title),
    );
    assert.ok(titles.some((t) => t?.includes('AUTH-101')));
    assert.ok(titles.some((t) => t?.includes('AUTH-113')));

    const login = report.testResults?.[0]?.assertionResults?.[0];
    const loginQa = login?.meta?.qa as
      | { framework?: string; steps?: unknown[] }
      | undefined;
    assert.equal(loginQa?.framework, 'wdio');
    assert.ok((loginQa?.steps?.length ?? 0) >= 1);

    const ignored = report.testResults
      ?.flatMap((f) => f.assertionResults ?? [])
      .find((a) => a.title?.includes('AUTH-113'));
    const ignoredQa = ignored?.meta?.qa as { ignore?: boolean } | undefined;
    assert.equal(ignoredQa?.ignore, true);
  });
});

describe('qa.step → meta.qa.steps (FR125)', () => {
  it('preserves nested step order via qaMetaFromEntries', () => {
    const wire = qaMetaFromEntries(
      [
        { type: 'qa-step-start', body: 'outer' },
        { type: 'qa-step-start', body: 'inner' },
        { type: 'qa-step-end', body: { name: 'inner', status: 'passed' } },
        { type: 'qa-step-end', body: { name: 'outer', status: 'passed' } },
        { type: 'qa-suite', body: 'E-commerce\tLogin' },
      ],
      { framework: 'wdio', reporter: 'qa-wdio' },
    );
    assert.ok(wire);
    assert.equal(wire?.framework, 'wdio');
    assert.equal(wire?.steps?.length, 2);
    assert.equal(wire?.steps?.[0]?.name, 'outer');
    assert.equal(wire?.steps?.[1]?.name, 'inner');
    assert.deepEqual(wire?.suite, [{ title: 'E-commerce' }, { title: 'Login' }]);
  });
});
