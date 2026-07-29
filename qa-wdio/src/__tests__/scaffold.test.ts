import { qaDescribe, qaItAuto, expect } from '@qa/test';

import { ModeEnum, QAnalyzerReporter } from '@qanalyzer/forge-commons';

import {
  afterRunHook,
  assertHooksForMode,
  beforeRunHook,
  hooksLifecycle,
} from '../hooks.js';
import { MetadataManager, qa } from '../helpers.js';
import { QaWdioService } from '../service.js';
import { QaWdioReporter } from '../reporter.js';
import QaWdioReporterDefault from '../index.js';

qaDescribe('@qanalyzer/forge-wdio scaffold', () => {
  qaItAuto('loads reporter module and no-ops when mode=off', async () => {
    QAnalyzerReporter.resetInstance();
    hooksLifecycle.reset();

    await beforeRunHook({ mode: ModeEnum.off, projectKey: 'AUTH' });

    const reporter = new QaWdioReporter({
      mode: ModeEnum.off,
      projectKey: 'AUTH',
    });
    expect(reporter).toBeTruthy();
    expect(reporter.disableWebdriverStepsReporting).toBe(true);
    expect(QaWdioReporterDefault).toBe(QaWdioReporter);

    reporter.onRunnerEnd();
    await afterRunHook();

    const instance = QAnalyzerReporter.getInstance();
    expect(instance.getConfig().mode).toBe(ModeEnum.off);
    expect(hooksLifecycle.beforeCalled).toBe(true);
    expect(hooksLifecycle.afterCalled).toBe(true);
  });

  qaItAuto('exports QaWdioService lifecycle hooks', async () => {
    const service = new QaWdioService({});
    service.before();
    service.beforeTest();
    await service.afterTest({ title: 't' }, {}, { passed: true });
    service.after();
    expect(service).toBeTruthy();
  });

  qaItAuto('qa helpers record metadata including nested steps and type attach', async () => {
    MetadataManager.clear();
    qa.suite('E-commerce\tLogin');
    qa.fields({ layer: 'e2e' });
    qa.parameters({ user: 'standard_user' });
    qa.comment('ok');
    qa.ignore();
    qa.attach({ name: 'note.txt', type: 'text/plain' });

    await qa.step('outer', async (step) => {
      await step.step('inner', async () => {
        // nested
      });
    });

    const entries = MetadataManager.getEntries();
    expect(entries.some((e) => e.type === 'qa-suite')).toBeTruthy();
    expect(entries.some((e) => e.type === 'qa-fields')).toBeTruthy();
    expect(entries.some((e) => e.type === 'qa-parameters')).toBeTruthy();
    expect(entries.some((e) => e.type === 'qa-comment')).toBeTruthy();
    expect(entries.some((e) => e.type === 'qa-ignore')).toBeTruthy();
    expect(entries.some(
        (e) =>
          e.type === 'qa-attach' &&
          (e.body as { type?: string }).type === 'text/plain',
      ),).toBeTruthy();
    expect(entries.some((e) => e.type === 'qa-step-start' && e.body === 'outer')).toBeTruthy();
    expect(entries.some((e) => e.type === 'qa-step-start' && e.body === 'inner')).toBeTruthy();
    expect(entries.some(
        (e) =>
          e.type === 'qa-step-end' &&
          (e.body as { name: string; status: string }).name === 'inner' &&
          (e.body as { status: string }).status === 'passed',
      ),).toBeTruthy();
  });

  qaItAuto('assertHooksForMode throws in debug when hooks missing (NFR33)', () => {
    hooksLifecycle.reset();
    expect(() => assertHooksForMode(ModeEnum.ingest, true)).toThrow(/beforeRunHook|afterRunHook|NFR33/);
  });
});
