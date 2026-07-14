import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { buildJestCompatibleReport, groupCasesByFile } from '../report-builder.js';

describe('buildJestCompatibleReport', () => {
  it('maps collected cases to Jest-compatible JSON with counts', () => {
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

    assert.equal(report.numTotalTests, 3);
    assert.equal(report.numPassedTests, 1);
    assert.equal(report.numFailedTests, 1);
    assert.equal(report.numPendingTests, 1);
    assert.equal(report.success, false);
    assert.equal(report.testResults?.length, 2);
    assert.equal(report.testResults?.[0]?.assertionResults?.[1]?.title, 'AUTH-102 fails');
  });

  it('attaches meta.qa onto assertionResults when present', () => {
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

    assert.deepEqual(report.testResults?.[0]?.assertionResults?.[0]?.meta?.qa, {
      framework: 'vitest',
      suite: [{ title: 'Auth' }],
      steps: [{ id: 's1', stepType: 'text', name: 'open', status: 'passed' }],
    });
  });
});
