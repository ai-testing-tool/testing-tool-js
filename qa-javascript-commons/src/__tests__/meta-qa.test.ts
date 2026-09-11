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

  qaItAuto('builds suiteId/plan/fix/sprint/labels onto meta.qa', () => {
    const wire = qaMetaFromEntries(
      [
        { type: 'qa-suite-id', body: 'suite-uuid' },
        { type: 'qa-plan-id', body: 'plan-uuid' },
        { type: 'qa-plan', body: 'Smoke' },
        { type: 'qa-fix-version', body: '2.4.0' },
        { type: 'qa-sprint-name', body: 'Sprint 42' },
        { type: 'qa-labels', body: 'test-auto,flaky' },
        { type: 'qa-labels', body: ['flaky', 'nightly'] },
      ],
      { framework: 'jest' },
    );
    expect(wire).toBeTruthy();
    expect(wire.suiteId).toBe('suite-uuid');
    expect(wire.planId).toBe('plan-uuid');
    expect(wire.planName).toBe('Smoke');
    expect(wire.fixVersion).toBe('2.4.0');
    expect(wire.sprintName).toBe('Sprint 42');
    expect(wire.labels).toEqual(['test-auto', 'flaky', 'nightly']);
  });

  qaItAuto('parses message prefixes for plan/labels annotations', () => {
    const acc = createQaMetaAccumulator();
    applyQaAnnotations(acc, [
      { message: 'QA SuiteId: sid-1', type: 'qa-suite-id' },
      { message: 'QA PlanId: pid-1', type: 'qa-plan-id' },
      { message: 'QA Plan: Regression', type: 'qa-plan' },
      { message: 'QA FixVersion: 3.0.0', type: 'qa-fix-version' },
      { message: 'QA SprintName: Sprint 99', type: 'qa-sprint-name' },
      { message: 'QA Labels: a, b', type: 'qa-labels' },
    ]);
    const wire = toQaMetaWire(acc, { framework: 'vitest' });
    expect(wire?.suiteId).toBe('sid-1');
    expect(wire?.planId).toBe('pid-1');
    expect(wire?.planName).toBe('Regression');
    expect(wire?.fixVersion).toBe('3.0.0');
    expect(wire?.sprintName).toBe('Sprint 99');
    expect(wire?.labels).toEqual(['a', 'b']);
  });

  qaItAuto('returns undefined for empty accumulator', () => {
    expect(toQaMetaWire(createQaMetaAccumulator(), { framework: 'vitest' })).toBeUndefined();
  });

  qaItAuto('embeds ci and git on meta.qa.host', () => {
    const wire = qaMetaFromEntries([{ type: 'qa-step', body: 'ping' }], {
      framework: 'jest',
      ci: { platform: 'github', buildUrl: 'https://ci.example/1' },
      git: {
        commitSha: 'abc123',
        branch: 'main',
        authorName: 'Dev',
        authorEmail: 'dev@example.com',
      },
    });
    expect(wire?.host).toEqual({
      framework: 'jest',
      reporter: '@ai-testing-tool/forge-jest',
      ci: { platform: 'github', buildUrl: 'https://ci.example/1' },
      git: {
        commitSha: 'abc123',
        branch: 'main',
        authorName: 'Dev',
        authorEmail: 'dev@example.com',
      },
    });
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
