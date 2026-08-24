import { qaDescribe, qaItAuto, expect } from '@qa/test';

import { buildJestCompatibleReport, groupCasesByFile } from '../report-builder.js';

qaDescribe('buildJestCompatibleReport', () => {
  qaItAuto('maps collected cases to Jest-compatible JSON with counts', () => {
    const report = buildJestCompatibleReport(
      groupCasesByFile([
        {
          id: '1',
          name: 'AUTH-101 passes',
          fullName: 'Suite AUTH-101 passes',
          filePath: '/tests/a.test.ts',
          ancestorTitles: ['Suite'],
          status: 'passed',
          durationMs: 10,
          failureMessages: [],
        },
        {
          id: '2',
          name: 'AUTH-102 fails',
          fullName: 'Suite AUTH-102 fails',
          filePath: '/tests/a.test.ts',
          ancestorTitles: ['Suite'],
          status: 'failed',
          durationMs: 20,
          failureMessages: ['Unable to find an accessible element'],
        },
        {
          id: '3',
          name: 'skipped',
          fullName: 'Other skipped',
          filePath: '/tests/b.test.ts',
          ancestorTitles: ['Other'],
          status: 'skipped',
          durationMs: null,
          failureMessages: [],
        },
      ]),
      { startTime: 1_700_000_000_000 }
    );

    expect(report.numTotalTests).toBe(3);
    expect(report.numPassedTests).toBe(1);
    expect(report.numFailedTests).toBe(1);
    expect(report.numPendingTests).toBe(1);
    expect(report.success).toBe(false);
    expect(report.testResults?.length).toBe(2);
    expect(report.testResults?.[0]?.assertionResults?.[1]?.title).toBe('AUTH-102 fails');
    expect(report.testResults?.[0]?.assertionResults?.[0]?.ancestorTitles).toBeUndefined();
  });

  qaItAuto('attaches meta.qa onto assertionResults when present', () => {
    const report = buildJestCompatibleReport(
      groupCasesByFile([
        {
          id: '1',
          name: 'AUTH-101',
          fullName: 'AUTH-101',
          filePath: '/t.test.ts',
          ancestorTitles: [],
          status: 'passed',
          durationMs: 1,
          failureMessages: [],
          metaQa: {
            framework: 'vitest',
            suite: [{ title: 'Auth' }],
            steps: [{ id: 's1', stepType: 'text', name: 'open', status: 'passed' }],
          },
        },
      ]),
    );

    expect(report.testResults?.[0]?.assertionResults?.[0]?.meta?.qa).toEqual({
      framework: 'vitest',
      suite: [{ title: 'Auth' }],
      steps: [{ id: 's1', stepType: 'text', name: 'open', status: 'passed' }],
    });
  });
});
