import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { qaDescribe, qaItAuto, expect } from '@qa/test';

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

qaDescribe('toJestJsonReport', () => {
  qaItAuto('maps Mocha-like specs to FR41 shape A with meta.qa steps', () => {
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

    expect(report.numTotalTests).toBe(2);
    expect(report.numPassedTests).toBe(1);
    expect(report.numFailedTests).toBe(1);
    expect(report.success).toBe(false);
    expect(report.testResults?.[0]?.assertionResults?.[0]?.title).toBe('AUTH-101 User can login with valid credentials');
    expect((report.testResults?.[0]?.assertionResults?.[0]?.meta?.qa as { framework?: string })
        ?.framework).toBe('cypress',);
    expect((report.testResults?.[0]?.assertionResults?.[0]?.meta?.qa as { steps?: unknown[] })
        ?.steps?.length).toBe(1,);
    expect(report.testResults?.[0]?.assertionResults?.[0]?.ancestorTitles).toBeUndefined();
  });
});

qaDescribe('saucedemo fixture (FR69)', () => {
  qaItAuto('normalizes 13 reference tests with counts and AUTH titles', () => {
    const specs = loadSaucedemoFixture();
    const report = toJestJsonReport(specs, 1_700_000_000_000);

    expect(report.numTotalTestSuites).toBe(4);
    expect(report.numTotalTests).toBe(13);
    expect(report.numPassedTests).toBe(12);
    expect(report.numPendingTests).toBe(1);
    expect(report.numFailedTests).toBe(0);
    expect(report.success).toBe(true);

    const titles: string[] = [];
    for (const file of report.testResults ?? []) {
      for (const a of file.assertionResults ?? []) {
        titles.push(String(a.title));
      }
    }
    expect(titles.length).toBe(13);
    expect(titles.every((t) => /^AUTH-\d+/.test(t))).toBeTruthy();
    expect(titles.includes('AUTH-101 User can login with valid credentials')).toBeTruthy();
    expect(titles.includes('AUTH-113 Demo test that will be ignored in reporting')).toBeTruthy();

    const login = report.testResults?.find((f) => f.name?.includes('login'));
    const firstQa = login?.assertionResults?.[0]?.meta?.qa as {
      steps?: Array<{ name: string }>;
    };
    expect(firstQa?.steps && firstQa.steps.length >= 3).toBeTruthy();
  });
});
