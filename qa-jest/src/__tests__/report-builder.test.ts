import { qaDescribe, qaItAuto, expect } from '@qa/test';

import { toJestJsonReport } from '../report-builder.js';
import { drainQaMeta, qa } from '../jest.js';

qaDescribe('toJestJsonReport', () => {
  qaItAuto('maps AggregatedResult nested testResults to assertionResults', () => {
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

    expect(report.numTotalTests).toBe(3);
    expect(report.numPassedTests).toBe(1);
    expect(report.numFailedTests).toBe(1);
    expect(report.numPendingTests).toBe(1);
    expect(report.success).toBe(false);
    expect(report.testResults?.length).toBe(2);
    expect(report.testResults?.[0]?.name).toBe('/tests/a.test.js');
    expect(report.testResults?.[0]?.assertionResults?.[1]?.title).toBe('AUTH-102 fails');
    expect(report.testResults?.[0]?.assertionResults?.[0]?.ancestorTitles).toBeUndefined();
  });

  qaItAuto('passes through native --json assertionResults shape', () => {
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

    expect(report.numTotalTests).toBe(1);
    expect(report.testResults?.[0]?.name).toBe('/tests/c.test.js');
    expect(report.testResults?.[0]?.assertionResults?.[0]?.title).toBe('AUTH-200 ok');
  });
  qaItAuto('attaches meta.qa from helper map by fullName', () => {
    const metaByFullName = new Map([
      [
        'Suite AUTH-101 passes',
        {
          framework: 'jest' as const,
          suite: [{ title: 'Auth' }],
          steps: [{ id: 's1', stepType: 'text' as const, name: 'open', status: 'passed' as const }],
        },
      ],
    ]);

    const report = toJestJsonReport(
      {
        testResults: [
          {
            name: '/tests/a.test.js',
            assertionResults: [
              {
                fullName: 'Suite AUTH-101 passes',
                title: 'AUTH-101 passes',
                status: 'passed',
              },
            ],
          },
        ],
      },
      metaByFullName,
    );

    const qa = report.testResults?.[0]?.assertionResults?.[0]?.meta?.qa as
      | { suite?: Array<{ title: string }> }
      | undefined;
    expect(qa?.suite).toEqual([{ title: 'Auth' }]);
  });
});

qaDescribe('qa helpers', () => {
  qaItAuto('records step and suite metadata', async () => {
    drainQaMeta();
    await qa.suite('Auth');
    await qa.step('open form', async () => undefined);
    const meta = drainQaMeta();
    expect(meta.map((m) => m.type)).toEqual(['qa-suite', 'qa-step', 'qa-step-end'],);
  });
});
