import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import { qaMetaFromEntries } from '@qanalyzer/forge-commons';

import {
  toJestJsonReport,
  type CypressSpecInput,
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

function loadSaucedemoFixture(): CypressSpecInput[] {
  const raw = JSON.parse(
    readFileSync(join(__dirname, '../__fixtures__/saucedemo-13.json'), 'utf8'),
  ) as FixtureFile;

  return raw.specs.map((spec) => ({
    name: spec.name,
    assertions: spec.assertions.map((a) => {
      const entries: Array<{ type: string; body: unknown }> = [];
      for (const step of a.steps ?? []) {
        entries.push({ type: 'qa-step', body: step });
        entries.push({ type: 'qa-step-end', body: { name: step, status: 'passed' } });
      }
      if (a.ignore) {
        entries.push({ type: 'qa-ignore', body: true });
      }
      const wire = qaMetaFromEntries(entries, {
        framework: 'cypress',
        reporter: '@qanalyzer/forge-cypress',
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

describe('toJestJsonReport', () => {
  it('maps Mocha-like specs to FR41 shape A with meta.qa steps', () => {
    const wire = qaMetaFromEntries(
      [
        { type: 'qa-suite', body: 'E-commerce\tLogin' },
        { type: 'qa-step', body: 'Fill in username' },
        { type: 'qa-step-end', body: { name: 'Fill in username', status: 'passed' } },
      ],
      { framework: 'cypress', reporter: '@qanalyzer/forge-cypress' },
    );

    const report = toJestJsonReport(
      [
        {
          name: 'cypress/e2e/login.cy.js',
          assertions: [
            {
              ancestorTitles: ['Login Scenarios'],
              title: 'AUTH-101 User can login with valid credentials',
              status: 'passed',
              duration: 10,
              meta: wire ? { qa: wire } : undefined,
            },
            {
              ancestorTitles: ['Login Scenarios'],
              title: 'AUTH-102 fails',
              status: 'failed',
              duration: 5,
              failureMessages: ['Timed out retrying'],
            },
          ],
        },
      ],
      1_700_000_000_000,
    );

    assert.equal(report.numTotalTests, 2);
    assert.equal(report.numPassedTests, 1);
    assert.equal(report.numFailedTests, 1);
    assert.equal(report.success, false);
    assert.equal(report.testResults?.[0]?.assertionResults?.[0]?.title, 'AUTH-101 User can login with valid credentials');
    assert.equal(
      (report.testResults?.[0]?.assertionResults?.[0]?.meta?.qa as { framework?: string })
        ?.framework,
      'cypress',
    );
    assert.equal(
      (report.testResults?.[0]?.assertionResults?.[0]?.meta?.qa as { steps?: unknown[] })
        ?.steps?.length,
      1,
    );
  });
});

describe('saucedemo fixture (FR69)', () => {
  it('normalizes 13 reference tests with counts and AUTH titles', () => {
    const specs = loadSaucedemoFixture();
    const report = toJestJsonReport(specs, 1_700_000_000_000);

    assert.equal(report.numTotalTestSuites, 4);
    assert.equal(report.numTotalTests, 13);
    assert.equal(report.numPassedTests, 12);
    assert.equal(report.numPendingTests, 1);
    assert.equal(report.numFailedTests, 0);
    assert.equal(report.success, true);

    const titles: string[] = [];
    for (const file of report.testResults ?? []) {
      for (const a of file.assertionResults ?? []) {
        titles.push(String(a.title));
      }
    }
    assert.equal(titles.length, 13);
    assert.ok(titles.every((t) => /^AUTH-\d+/.test(t)));
    assert.ok(titles.includes('AUTH-101 User can login with valid credentials'));
    assert.ok(titles.includes('AUTH-113 Demo test that will be ignored in reporting'));

    const login = report.testResults?.find((f) => f.name?.includes('login'));
    const firstQa = login?.assertionResults?.[0]?.meta?.qa as {
      steps?: Array<{ name: string }>;
    };
    assert.ok(firstQa?.steps && firstQa.steps.length >= 3);
  });
});
