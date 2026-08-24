import { qaDescribe, qaItAuto, expect } from '@qa/test';

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

qaDescribe('cucumber tags (FR135)', () => {
  qaItAuto('applies @QaSuite/@QaTitle/@QaFields and collects bare issue keys', () => {
    MetadataManager.clear();
    const { issueKeys } = applyCucumberTags([
      { name: '@AUTH-101' },
      { name: '@QaSuite=Checkout' },
      { name: '@QaTitle=Buy stuff' },
      { name: '@QaFields={"layer":"e2e"}' },
    ]);
    expect(issueKeys).toEqual(['AUTH-101']);
    const entries = MetadataManager.getEntries();
    expect(entries.some((e) => e.type === 'qa-suite' && e.body === 'Checkout')).toBeTruthy();
    expect(entries.some((e) => e.type === 'qa-title' && e.body === 'Buy stuff')).toBeTruthy();
    expect(entries.some(
        (e) =>
          e.type === 'qa-fields' &&
          typeof e.body === 'object' &&
          e.body !== null &&
          (e.body as { layer?: string }).layer === 'e2e',
      ),).toBeTruthy();
    MetadataManager.clear();
  });
});

qaDescribe('QaWdioReporter useCucumber (FR135)', () => {
  qaItAuto('records one assertion per scenario with gherkin steps', () => {
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
    expect(specs.length).toBe(1);
    expect(specs[0]!.assertions.length).toBe(1);
    const a = specs[0]!.assertions[0]!;
    expect(a.status).toBe('failed');
    expect(a.title).toBe('User can login');
    expect(a.meta?.qa?.issueKeys).toEqual(['AUTH-101']);
    expect(a.meta?.qa?.steps).toBeTruthy();
    expect(a.meta!.qa!.steps!.length).toBe(2);
    expect(a.meta!.qa!.steps![0]!.stepType).toBe('gherkin');
    expect(a.meta!.qa!.steps![1]!.status).toBe('failed');
    expect((a.failureMessages ?? []).some((m) => m.includes('boom'))).toBeTruthy();
  });

  qaItAuto('mocha path unchanged when useCucumber is false', () => {
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
    expect(specs[0]!.assertions.length).toBe(1);
    expect(specs[0]!.assertions[0]!.title).toBe('AUTH-9 passes');
    expect(specs[0]!.assertions[0]!.status).toBe('passed');
  });
});
