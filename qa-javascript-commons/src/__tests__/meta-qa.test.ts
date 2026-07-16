import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  applyQaAnnotations,
  buildIngestPayload,
  createQaMetaAccumulator,
  normalizeJestReport,
  qaMetaFromEntries,
  toQaMetaWire,
} from '../models';

describe('meta.qa enrichment', () => {
  it('builds wire shape from Vitest-style annotations', () => {
    const acc = createQaMetaAccumulator();
    applyQaAnnotations(acc, [
      { message: 'QA Suite: Auth\tLogin', type: 'qa-suite', body: 'Auth\tLogin' },
      { message: 'QA Fields: {"layer":"api"}', type: 'qa-fields', body: { layer: 'api' } },
      { message: 'QA IssueKey: AUTH-101', type: 'qa-issue-key', body: 'AUTH-101' },
      {
        message: 'QA IssueKeys: AUTH-10,AUTH-11',
        type: 'qa-issue-keys',
        body: ['AUTH-10', 'AUTH-11'],
      },
      { message: 'QA Step: fetch users', type: 'qa-step', body: 'fetch users' },
      { message: 'QA Step Failed: fetch users', type: 'qa-step-failed', body: { name: 'fetch users' } },
      { message: 'QA Comment: flaky env', type: 'qa-comment', body: 'flaky env' },
    ]);

    const wire = toQaMetaWire(acc, { framework: 'vitest' });
    assert.ok(wire);
    assert.equal(wire.framework, 'vitest');
    assert.deepEqual(wire.suite, [{ title: 'Auth' }, { title: 'Login' }]);
    assert.deepEqual(wire.fields, { layer: 'api' });
    assert.deepEqual(wire.issueKeys, ['AUTH-101', 'AUTH-10', 'AUTH-11']);
    assert.equal(wire.comment, 'flaky env');
    assert.equal(wire.steps?.[0]?.name, 'fetch users');
    assert.equal(wire.steps?.[0]?.status, 'failed');
    assert.equal(wire.steps?.[0]?.stepType, 'text');
    assert.equal(wire.host?.reporter, '@qanalyzer/forge-vitest');
  });

  it('builds wire shape from helper buffer entries', () => {
    const wire = qaMetaFromEntries(
      [
        { type: 'qa-suite', body: 'CRUD' },
        { type: 'qa-step', body: 'create' },
        { type: 'qa-attach', body: { name: 'body.json', contentType: 'application/json' } },
      ],
      { framework: 'jest' },
    );
    assert.ok(wire);
    assert.equal(wire.framework, 'jest');
    assert.deepEqual(wire.suite, [{ title: 'CRUD' }]);
    assert.equal(wire.attachments?.[0]?.file_name, 'body.json');
    assert.equal(wire.attachments?.[0]?.mime_type, 'application/json');
  });

  it('returns undefined for empty accumulator', () => {
    assert.equal(toQaMetaWire(createQaMetaAccumulator(), { framework: 'vitest' }), undefined);
  });

  it('preserves meta.qa through normalizeJestReport and buildIngestPayload (FR141)', () => {
    const qa = toQaMetaWire(
      (() => {
        const acc = createQaMetaAccumulator();
        applyQaAnnotations(acc, [{ type: 'qa-step', body: 'open form' }]);
        return acc;
      })(),
      { framework: 'vitest' },
    );

    const report = normalizeJestReport({
      numTotalTests: 1,
      numPassedTests: 1,
      numFailedTests: 0,
      success: true,
      testResults: [
        {
          name: '/t.test.ts',
          status: 'passed',
          assertionResults: [
            {
              title: 'AUTH-101',
              fullName: 'AUTH-101',
              status: 'passed',
              meta: { qa },
            },
          ],
        },
      ],
    });

    const payload = buildIngestPayload({
      projectKey: 'AUTH',
      report,
      format: 'vitest-json',
    });

    assert.deepEqual(
      payload.report.testResults?.[0]?.assertionResults?.[0]?.meta?.qa,
      qa,
    );
  });
});
