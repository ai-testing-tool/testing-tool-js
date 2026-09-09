import { qaDescribe, qaItAuto, expect } from '@qa/test';

import {
  applyQaAnnotations,
  buildIngestPayload,
  createQaMetaAccumulator,
  normalizeJestReport,
  qaMetaFromEntries,
  toQaMetaWire,
} from '../models';

qaDescribe('meta.qa enrichment', () => {
  qaItAuto('builds wire shape from Vitest-style annotations', () => {
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
    expect(wire).toBeTruthy();
    expect(wire.framework).toBe('vitest');
    expect(wire.suite).toEqual([{ title: 'Auth' }, { title: 'Login' }]);
    expect(wire.fields).toEqual({ layer: 'api' });
    expect(wire.issueKeys).toEqual(['AUTH-101', 'AUTH-10', 'AUTH-11']);
    expect(wire.comment).toBe('flaky env');
    expect(wire.steps?.[0]?.name).toBe('fetch users');
    expect(wire.steps?.[0]?.status).toBe('failed');
    expect(wire.steps?.[0]?.stepType).toBe('text');
    expect(wire.host?.reporter).toBe('@ai-testing-tool/forge-vitest');
  });

  qaItAuto('builds wire shape from helper buffer entries', () => {
    const wire = qaMetaFromEntries(
      [
        { type: 'qa-suite', body: 'CRUD' },
        { type: 'qa-step', body: 'create' },
        { type: 'qa-attach', body: { name: 'body.json', contentType: 'application/json' } },
      ],
      { framework: 'jest' },
    );
    expect(wire).toBeTruthy();
    expect(wire.framework).toBe('jest');
    expect(wire.suite).toEqual([{ title: 'CRUD' }]);
    expect(wire.attachments?.[0]?.file_name).toBe('body.json');
    expect(wire.attachments?.[0]?.mime_type).toBe('application/json');
  });

  qaItAuto('returns undefined for empty accumulator', () => {
    expect(toQaMetaWire(createQaMetaAccumulator(), { framework: 'vitest' })).toBeUndefined();
  });

  qaItAuto('preserves meta.qa through normalizeJestReport and buildIngestPayload (FR141)', () => {
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

    expect(payload.report.testResults?.[0]?.assertionResults?.[0]?.meta?.qa).toEqual(qa,);
  });
});
