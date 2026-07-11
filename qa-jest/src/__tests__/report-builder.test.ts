import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { toJestJsonReport } from '../report-builder.js';
import { drainQaMeta, qa } from '../jest.js';

describe('toJestJsonReport', () => {
  it('maps AggregatedResult nested testResults to assertionResults', () => {
    const report = toJestJsonReport({
      startTime: 1_700_000_000_000,
      success: false,
      testResults: [
        {
          testFilePath: '/tests/a.test.js',
          testResults: [
            {
              ancestorTitles: ['Suite'],
              fullName: 'Suite AUTH-101 passes',
              title: 'AUTH-101 passes',
              status: 'passed',
              duration: 10,
              failureMessages: [],
            },
            {
              ancestorTitles: ['Suite'],
              fullName: 'Suite AUTH-102 fails',
              title: 'AUTH-102 fails',
              status: 'failed',
              duration: 20,
              failureMessages: ['Expected true'],
            },
          ],
        },
        {
          testFilePath: '/tests/b.test.js',
          testResults: [
            {
              ancestorTitles: ['Other'],
              fullName: 'Other skipped',
              title: 'skipped',
              status: 'pending',
              duration: null,
              failureMessages: [],
            },
          ],
        },
      ],
    });

    assert.equal(report.numTotalTests, 3);
    assert.equal(report.numPassedTests, 1);
    assert.equal(report.numFailedTests, 1);
    assert.equal(report.numPendingTests, 1);
    assert.equal(report.success, false);
    assert.equal(report.testResults?.length, 2);
    assert.equal(report.testResults?.[0]?.name, '/tests/a.test.js');
    assert.equal(report.testResults?.[0]?.assertionResults?.[1]?.title, 'AUTH-102 fails');
  });

  it('passes through native --json assertionResults shape', () => {
    const report = toJestJsonReport({
      numTotalTests: 1,
      numPassedTests: 1,
      numFailedTests: 0,
      numPendingTests: 0,
      numTodoTests: 0,
      success: true,
      startTime: 100,
      testResults: [
        {
          name: '/tests/c.test.js',
          status: 'passed',
          assertionResults: [
            {
              ancestorTitles: [],
              fullName: 'AUTH-200 ok',
              title: 'AUTH-200 ok',
              status: 'passed',
              duration: 5,
              failureMessages: [],
            },
          ],
        },
      ],
    });

    assert.equal(report.numTotalTests, 1);
    assert.equal(report.testResults?.[0]?.name, '/tests/c.test.js');
    assert.equal(report.testResults?.[0]?.assertionResults?.[0]?.title, 'AUTH-200 ok');
  });
});

describe('qa helpers', () => {
  it('records step and suite metadata', async () => {
    drainQaMeta();
    await qa.suite('Auth');
    await qa.step('open form', async () => undefined);
    const meta = drainQaMeta();
    assert.deepEqual(
      meta.map((m) => m.type),
      ['qa-suite', 'qa-step'],
    );
  });
});
