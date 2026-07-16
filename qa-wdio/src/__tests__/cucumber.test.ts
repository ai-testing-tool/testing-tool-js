import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { applyCucumberTags } from '../cucumber-tags.js';
import { MetadataManager } from '../metadata-manager.js';
import { QaWdioReporter } from '../reporter.js';
import { ResultsBuffer } from '../results-buffer.js';

function fakeSuite(
  partial: Record<string, unknown>,
): Parameters<QaWdioReporter['onSuiteStart']>[0] {
  return partial as unknown as Parameters<QaWdioReporter['onSuiteStart']>[0];
}

function fakeTest(
  partial: Record<string, unknown>,
): Parameters<QaWdioReporter['onTestPass']>[0] {
  return partial as unknown as Parameters<QaWdioReporter['onTestPass']>[0];
}

describe('cucumber tags (FR135)', () => {
  it('applies suite/title/tags and collects bare issue keys', () => {
    MetadataManager.clear();
    const { issueKeys } = applyCucumberTags([
      { name: '@AUTH-101' },
      { name: '@suite=Checkout' },
      { name: '@title=Buy stuff' },
      { name: '@tags=smoke,e2e' },
    ]);
    assert.deepEqual(issueKeys, ['AUTH-101']);
    const entries = MetadataManager.getEntries();
    assert.ok(entries.some((e) => e.type === 'qa-suite' && e.body === 'Checkout'));
    assert.ok(entries.some((e) => e.type === 'qa-title' && e.body === 'Buy stuff'));
    assert.ok(
      entries.some(
        (e) =>
          e.type === 'qa-fields' &&
          typeof e.body === 'object' &&
          e.body !== null &&
          (e.body as { tags?: string }).tags === 'smoke,e2e',
      ),
    );
    MetadataManager.clear();
  });
});

describe('QaWdioReporter useCucumber (FR135)', () => {
  it('records one assertion per scenario with gherkin steps', () => {
    ResultsBuffer.reset({ mode: 'off', projectKey: 'AUTH' });
    const reporter = new QaWdioReporter({
      useCucumber: true,
      mode: 'off',
      projectKey: 'AUTH',
    });

    reporter.onSuiteStart(
      fakeSuite({
        uid: 'feature-1',
        title: 'Login',
        type: 'feature',
        file: 'features/login.feature',
      }),
    );
    reporter.onSuiteStart(
      fakeSuite({
        uid: 'scenario-1',
        title: 'User can login',
        type: 'scenario',
        file: 'features/login.feature',
        tags: [{ name: '@AUTH-101' }],
        tests: [],
        hooks: [],
      }),
    );

    const step1 = fakeTest({ title: 'Given I open login', state: 'passed', errors: [] });
    reporter.onTestStart(step1);
    reporter.onTestPass(step1);
    const step2 = fakeTest({
      title: 'When I submit',
      state: 'failed',
      errors: [{ message: 'boom' }],
    });
    reporter.onTestStart(step2);
    reporter.onTestFail(step2);

    reporter.onSuiteEnd(
      fakeSuite({
        uid: 'scenario-1',
        title: 'User can login',
        type: 'scenario',
        file: 'features/login.feature',
        tests: [
          { title: 'Given I open login', state: 'passed' },
          { title: 'When I submit', state: 'failed', errors: [{ message: 'boom' }] },
        ],
        hooks: [],
      }),
    );

    const specs = ResultsBuffer.takeSpecs();
    assert.equal(specs.length, 1);
    assert.equal(specs[0]!.assertions.length, 1);
    const a = specs[0]!.assertions[0]!;
    assert.equal(a.status, 'failed');
    assert.equal(a.title, 'User can login');
    assert.deepEqual(a.meta?.qa?.issueKeys, ['AUTH-101']);
    assert.ok(a.meta?.qa?.steps);
    assert.equal(a.meta!.qa!.steps!.length, 2);
    assert.equal(a.meta!.qa!.steps![0]!.stepType, 'gherkin');
    assert.equal(a.meta!.qa!.steps![1]!.status, 'failed');
    assert.ok((a.failureMessages ?? []).some((m) => m.includes('boom')));
  });

  it('mocha path unchanged when useCucumber is false', () => {
    ResultsBuffer.reset({ mode: 'off', projectKey: 'AUTH' });
    const reporter = new QaWdioReporter({
      useCucumber: false,
      mode: 'off',
      projectKey: 'AUTH',
    });

    reporter.onSuiteStart(
      fakeSuite({
        uid: 'suite-1',
        title: 'Login',
        type: 'suite',
        file: 'test/login.spec.js',
      }),
    );
    const test = fakeTest({
      title: 'AUTH-9 passes',
      state: 'passed',
      duration: 10,
      errors: [],
      parent: 'Login',
    });
    reporter.onTestStart(test);
    reporter.onTestPass(test);

    const specs = ResultsBuffer.takeSpecs();
    assert.equal(specs[0]!.assertions.length, 1);
    assert.equal(specs[0]!.assertions[0]!.title, 'AUTH-9 passes');
    assert.equal(specs[0]!.assertions[0]!.status, 'passed');
  });
});
