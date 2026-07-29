import { qaDescribe, qaItAuto, expect } from '@qa/test';

import { qaMetaFromEntries } from '@qanalyzer/forge-commons';

import { toJestJsonReport } from '../report-builder.js';

qaDescribe('toJestJsonReport', () => {
  qaItAuto('maps Mocha specs to FR41 shape A with meta.qa steps', () => {
    const wire = qaMetaFromEntries(
      [
        { type: 'qa-suite', body: 'API\tCRUD' },
        { type: 'qa-step', body: 'GET /users' },
        { type: 'qa-step-end', body: { name: 'GET /users', status: 'passed' } },
      ],
      { framework: 'mocha', reporter: '@qanalyzer/forge-mocha' },
    );

    const report = toJestJsonReport(
      [
        {
          name: 'test/api-crud.spec.js',
          assertions: [
            {
              ancestorTitles: ['JSONPlaceholder User CRUD'],
              title: 'AUTH-101 GET all users',
              status: 'passed',
              duration: 42,
              failureMessages: [],
              meta: wire ? { qa: wire } : undefined,
            },
            {
              ancestorTitles: ['JSONPlaceholder User CRUD'],
              title: 'AUTH-102 GET single user',
              status: 'failed',
              duration: 10,
              failureMessages: ['Expected 200'],
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
    expect(report.testResults?.[0]?.status).toBe('failed');
    const qaMeta = report.testResults?.[0]?.assertionResults?.[0]?.meta?.qa as
      | { framework?: string; host?: { reporter?: string }; steps?: Array<{ name: string }> }
      | undefined;
    expect(qaMeta?.framework).toBe('mocha');
    expect(qaMeta?.host?.reporter).toBe('@qanalyzer/forge-mocha');
    expect(qaMeta?.steps?.[0]?.name).toBe('GET /users');
  });
});
