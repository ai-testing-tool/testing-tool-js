import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { qaDescribe, qaItAuto, expect } from '@qa/test';

import { QA_METADATA_CONTENT_TYPE } from '../metadata-manager.js';
import { buildQaMetaFromResult } from '../metadata-from-result.js';
import {
  toJestJsonReport,
  type PlaywrightSpecInput,
} from '../report-builder.js';
import { extractNativeSteps } from '../step-extractor.js';

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

function loadSaucedemoFixture(): PlaywrightSpecInput[] {
  const raw = JSON.parse(
    readFileSync(join(__dirname, '../__fixtures__/saucedemo-13.json'), 'utf8'),
  ) as FixtureFile;

  return raw.specs.map((spec) => ({
    name: spec.name,
    assertions: spec.assertions.map((a) => {
      const stepTree = (a.steps ?? []).map((name) => ({
        category: 'test.step',
        title: name,
        steps: [],
      }));
      const wire = buildQaMetaFromResult({
        steps: stepTree,
        attachments: a.ignore
          ? [
              {
                name: 'qanalyzer-metadata.json',
                contentType: QA_METADATA_CONTENT_TYPE,
                body: Buffer.from(JSON.stringify({ ignore: true }), 'utf8'),
              },
            ]
          : undefined,
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

qaDescribe('extractNativeSteps (FR112)', () => {
  qaItAuto('flattens test.step hierarchy and skips hooks', () => {
    const steps = extractNativeSteps([
      {
        category: 'hook',
        title: 'Before Hooks',
        steps: [{ category: 'pw:api', title: 'goto', steps: [] }],
      },
      {
        category: 'test.step',
        title: 'open login',
        steps: [
          {
            category: 'test.step',
            title: 'type username',
            steps: [],
          },
        ],
      },
      {
        category: 'test.step',
        title: 'submit',
        error: { message: 'boom' },
        steps: [],
      },
    ]);

    expect(steps.length).toBe(3);
    expect(steps[0]?.name).toBe('open login');
    expect(steps[0]?.status).toBe('passed');
    expect(steps[1]?.name).toBe('type username');
    expect(steps[2]?.name).toBe('submit');
    expect(steps[2]?.status).toBe('failed');
  });
});

qaDescribe('buildQaMetaFromResult', () => {
  qaItAuto('merges helper metadata attachments with native steps', () => {
    const wire = buildQaMetaFromResult({
      attachments: [
        {
          name: 'qanalyzer-metadata.json',
          contentType: QA_METADATA_CONTENT_TYPE,
          body: Buffer.from(
            JSON.stringify({ suite: 'Auth\tLogin', fields: { layer: 'e2e' } }),
            'utf8',
          ),
        },
      ],
      steps: [
        { category: 'test.step', title: 'open form', steps: [] },
      ],
    });

    expect(wire).toBeTruthy();
    expect(wire.framework).toBe('playwright');
    expect(wire.suite).toEqual([{ title: 'Auth' }, { title: 'Login' }]);
    expect(wire.fields).toEqual({ layer: 'e2e' });
    expect(wire.steps?.length).toBe(1);
    expect(wire.steps?.[0]?.name).toBe('open form');
  });
});

qaDescribe('toJestJsonReport', () => {
  qaItAuto('maps Playwright-like specs to FR41 shape A', () => {
    const report = toJestJsonReport(
      [
        {
          name: 'test/login.spec.js',
          assertions: [
            {
              ancestorTitles: ['Login'],
              title: 'AUTH-101 login',
              status: 'passed',
              duration: 10,
            },
            {
              ancestorTitles: ['Login'],
              title: 'AUTH-102 fail',
              status: 'failed',
              duration: 5,
              failureMessages: ['Timeout'],
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
  });
});

qaDescribe('saucedemo fixture (FR118)', () => {
  qaItAuto('normalizes 13 reference tests with AUTH titles and steps', () => {
    const specs = loadSaucedemoFixture();
    const report = toJestJsonReport(specs, 1_700_000_000_000);

    expect(report.numTotalTestSuites).toBe(4);
    expect(report.numTotalTests).toBe(13);
    expect(report.numPassedTests).toBe(12);
    expect(report.numPendingTests).toBe(1);
    expect(report.success).toBe(true);

    const titles: string[] = [];
    for (const file of report.testResults ?? []) {
      for (const a of file.assertionResults ?? []) {
        titles.push(String(a.title));
      }
    }
    expect(titles.length).toBe(13);
    expect(titles.every((t) => /^AUTH-\d+/.test(t))).toBeTruthy();

    const login = report.testResults?.find((f) => f.name?.includes('login'));
    const firstQa = login?.assertionResults?.[0]?.meta?.qa as {
      steps?: Array<{ name: string }>;
      framework?: string;
    };
    expect(firstQa?.framework).toBe('playwright');
    expect(firstQa?.steps && firstQa.steps.length >= 3).toBeTruthy();
  });
});
