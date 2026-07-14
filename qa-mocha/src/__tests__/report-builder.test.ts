import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { qaMetaFromEntries } from 'qa-javascript-commons';

import { toJestJsonReport } from '../report-builder.js';

describe('toJestJsonReport', () => {
  it('maps Mocha specs to FR41 shape A with meta.qa steps', () => {
    const wire = qaMetaFromEntries(
      [
        { type: 'qa-suite', body: 'API\tCRUD' },
        { type: 'qa-step', body: 'GET /users' },
        { type: 'qa-step-end', body: { name: 'GET /users', status: 'passed' } },
      ],
      { framework: 'mocha', reporter: 'qa-mocha' },
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

    assert.equal(report.numTotalTests, 2);
    assert.equal(report.numPassedTests, 1);
    assert.equal(report.numFailedTests, 1);
    assert.equal(report.success, false);
    assert.equal(report.testResults?.[0]?.status, 'failed');
    const qaMeta = report.testResults?.[0]?.assertionResults?.[0]?.meta?.qa as
      | { framework?: string; host?: { reporter?: string }; steps?: Array<{ name: string }> }
      | undefined;
    assert.equal(qaMeta?.framework, 'mocha');
    assert.equal(qaMeta?.host?.reporter, 'qa-mocha');
    assert.equal(qaMeta?.steps?.[0]?.name, 'GET /users');
  });
});
