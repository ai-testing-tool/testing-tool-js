import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

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

describe('@qanalyzer/forge-wdio scaffold', () => {
  it('loads reporter module and no-ops when mode=off', async () => {
    QAnalyzerReporter.resetInstance();
    hooksLifecycle.reset();

    await beforeRunHook({ mode: ModeEnum.off, projectKey: 'AUTH' });

    const reporter = new QaWdioReporter({
      mode: ModeEnum.off,
      projectKey: 'AUTH',
    });
    assert.ok(reporter);
    assert.equal(reporter.disableWebdriverStepsReporting, true);
    assert.equal(QaWdioReporterDefault, QaWdioReporter);

    reporter.onRunnerEnd();
    await afterRunHook();

    const instance = QAnalyzerReporter.getInstance();
    assert.equal(instance.getConfig().mode, ModeEnum.off);
    assert.equal(hooksLifecycle.beforeCalled, true);
    assert.equal(hooksLifecycle.afterCalled, true);
  });

  it('exports QaWdioService lifecycle hooks', async () => {
    const service = new QaWdioService({});
    service.before();
    service.beforeTest();
    await service.afterTest({ title: 't' }, {}, { passed: true });
    service.after();
    assert.ok(service);
  });

  it('qa helpers record metadata including nested steps and type attach', async () => {
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
    assert.ok(entries.some((e) => e.type === 'qa-suite'));
    assert.ok(entries.some((e) => e.type === 'qa-fields'));
    assert.ok(entries.some((e) => e.type === 'qa-parameters'));
    assert.ok(entries.some((e) => e.type === 'qa-comment'));
    assert.ok(entries.some((e) => e.type === 'qa-ignore'));
    assert.ok(
      entries.some(
        (e) =>
          e.type === 'qa-attach' &&
          (e.body as { type?: string }).type === 'text/plain',
      ),
    );
    assert.ok(entries.some((e) => e.type === 'qa-step-start' && e.body === 'outer'));
    assert.ok(entries.some((e) => e.type === 'qa-step-start' && e.body === 'inner'));
    assert.ok(
      entries.some(
        (e) =>
          e.type === 'qa-step-end' &&
          (e.body as { name: string; status: string }).name === 'inner' &&
          (e.body as { status: string }).status === 'passed',
      ),
    );
  });

  it('assertHooksForMode throws in debug when hooks missing (NFR33)', () => {
    hooksLifecycle.reset();
    assert.throws(
      () => assertHooksForMode(ModeEnum.ingest, true),
      /beforeRunHook|afterRunHook|NFR33/,
    );
  });
});
