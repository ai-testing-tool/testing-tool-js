import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

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

describe('extractNativeSteps (FR112)', () => {
  it('flattens test.step hierarchy and skips hooks', () => {
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

    assert.equal(steps.length, 3);
    assert.equal(steps[0]?.name, 'open login');
    assert.equal(steps[0]?.status, 'passed');
    assert.equal(steps[1]?.name, 'type username');
    assert.equal(steps[2]?.name, 'submit');
    assert.equal(steps[2]?.status, 'failed');
  });
});

describe('buildQaMetaFromResult', () => {
  it('merges helper metadata attachments with native steps', () => {
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

    assert.ok(wire);
    assert.equal(wire.framework, 'playwright');
    assert.deepEqual(wire.suite, [{ title: 'Auth' }, { title: 'Login' }]);
    assert.deepEqual(wire.fields, { layer: 'e2e' });
    assert.equal(wire.steps?.length, 1);
    assert.equal(wire.steps?.[0]?.name, 'open form');
  });
});

describe('toJestJsonReport', () => {
  it('maps Playwright-like specs to FR41 shape A', () => {
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

    assert.equal(report.numTotalTests, 2);
    assert.equal(report.numPassedTests, 1);
    assert.equal(report.numFailedTests, 1);
    assert.equal(report.success, false);
  });
});

describe('saucedemo fixture (FR118)', () => {
  it('normalizes 13 reference tests with AUTH titles and steps', () => {
    const specs = loadSaucedemoFixture();
    const report = toJestJsonReport(specs, 1_700_000_000_000);

    assert.equal(report.numTotalTestSuites, 4);
    assert.equal(report.numTotalTests, 13);
    assert.equal(report.numPassedTests, 12);
    assert.equal(report.numPendingTests, 1);
    assert.equal(report.success, true);

    const titles: string[] = [];
    for (const file of report.testResults ?? []) {
      for (const a of file.assertionResults ?? []) {
        titles.push(String(a.title));
      }
    }
    assert.equal(titles.length, 13);
    assert.ok(titles.every((t) => /^AUTH-\d+/.test(t)));

    const login = report.testResults?.find((f) => f.name?.includes('login'));
    const firstQa = login?.assertionResults?.[0]?.meta?.qa as {
      steps?: Array<{ name: string }>;
      framework?: string;
    };
    assert.equal(firstQa?.framework, 'playwright');
    assert.ok(firstQa?.steps && firstQa.steps.length >= 3);
  });
});
