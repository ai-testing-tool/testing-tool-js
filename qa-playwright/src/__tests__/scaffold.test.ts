import { qaDescribe, qaItAuto, expect } from '@qa/test';

import { ModeEnum, AiTestingToolReporter } from '@ai-testing-tool/forge-commons';

import { MetadataManager, qa } from '../helpers.js';
import { PlaywrightQaReporter } from '../reporter.js';
import PlaywrightQaReporterDefault from '../index.js';

qaDescribe('@ai-testing-tool/forge-playwright scaffold', () => {
  qaItAuto('loads reporter module and no-ops publish when mode=off', async () => {
    AiTestingToolReporter.resetInstance();

    const reporter = new PlaywrightQaReporter({
      mode: ModeEnum.off,
      projectKey: 'AUTH',
    });
    expect(reporter).toBeTruthy();
    expect(PlaywrightQaReporterDefault).toBe(PlaywrightQaReporter);

    reporter.onBegin({} as never, {} as never);
    reporter.onTestEnd({} as never, {} as never);
    await reporter.onEnd({} as never);

    const instance = AiTestingToolReporter.getInstance({ mode: ModeEnum.off });
    expect(instance.getConfig().mode).toBe(ModeEnum.off);
  });

  qaItAuto('qa helpers record metadata without Playwright context', () => {
    MetadataManager.clear();
    qa.suite('E-commerce\tLogin');
    qa.suiteId('suite-1');
    qa.planId('plan-1');
    qa.plan('Smoke');
    qa.fixVersion('2.4.0');
    qa.sprintName('Sprint 42');
    qa.labels('test-auto,flaky');
    qa.fields({ layer: 'e2e' });
    qa.parameters({ user: 'standard_user' });
    qa.comment('ok');
    qa.ignore();
    qa.attach({ name: 'note.txt', contentType: 'text/plain' });

    const entries = MetadataManager.getEntries();
    expect(entries.some((e) => e.type === 'qa-suite' && e.body === 'E-commerce\tLogin')).toBeTruthy();
    expect(entries.some((e) => e.type === 'qa-suite-id' && e.body === 'suite-1')).toBeTruthy();
    expect(entries.some((e) => e.type === 'qa-plan-id' && e.body === 'plan-1')).toBeTruthy();
    expect(entries.some((e) => e.type === 'qa-plan' && e.body === 'Smoke')).toBeTruthy();
    expect(entries.some((e) => e.type === 'qa-fix-version' && e.body === '2.4.0')).toBeTruthy();
    expect(entries.some((e) => e.type === 'qa-sprint-name' && e.body === 'Sprint 42')).toBeTruthy();
    expect(entries.some((e) => e.type === 'qa-labels' && e.body === 'test-auto,flaky')).toBeTruthy();
    expect(entries.some((e) => e.type === 'qa-fields')).toBeTruthy();
    expect(entries.some((e) => e.type === 'qa-parameters')).toBeTruthy();
    expect(entries.some((e) => e.type === 'qa-comment' && e.body === 'ok')).toBeTruthy();
    expect(entries.some((e) => e.type === 'qa-ignore')).toBeTruthy();
    expect(entries.some((e) => e.type === 'qa-attach')).toBeTruthy();
  });

  qaItAuto('does not export qa.step (FR112 — use native test.step)', () => {
    expect('step' in qa).toBe(false,
      'qa.step must not exist — use Playwright test.step()',);
  });
});
