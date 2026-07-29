import { EventEmitter } from 'node:events';
import { qaDescribe, qaItAuto, expect } from '@qa/test';

import { ModeEnum, QAnalyzerReporter } from '@qanalyzer/forge-commons';

import metadata from '../metadata.js';
import { MetadataManager, qa } from '../mocha.js';
import plugin from '../plugin.js';
import { CypressQaReporter } from '../reporter.js';

qaDescribe('@qanalyzer/forge-cypress scaffold', () => {
  qaItAuto('loads reporter module and no-ops publish when mode=off', async () => {
    QAnalyzerReporter.resetInstance();

    const runner = new EventEmitter() as EventEmitter & {
      on: EventEmitter['on'];
      once: EventEmitter['once'];
    };

    // Mocha Runner shape: EventEmitter with constants used in constructor
    const reporter = new CypressQaReporter(runner as never, {
      reporterOptions: { mode: ModeEnum.off, projectKey: 'AUTH' },
    });
    expect(reporter).toBeTruthy();

    runner.emit('test'); // Mocha EVENT_TEST_BEGIN
    runner.emit('end'); // Mocha EVENT_RUN_END

    // Allow async onRunEnd to settle
    await new Promise((r) => setImmediate(r));
    await new Promise((r) => setImmediate(r));

    const instance = QAnalyzerReporter.getInstance({ mode: ModeEnum.off });
    expect(instance.getConfig().mode).toBe(ModeEnum.off);
  });

  qaItAuto('plugin registration does not throw', () => {
    const events: string[] = [];
    const on = (event: string) => {
      events.push(event);
    };
    const config = { projectRoot: '/tmp' };
    const out = plugin(on, config);
    expect(out).toBe(config);
    expect(events.includes('before:run')).toBeTruthy();
    expect(events.includes('after:run')).toBeTruthy();
    expect(events.includes('after:screenshot')).toBeTruthy();
  });

  qaItAuto('metadata registration does not throw and records tasks', () => {
    MetadataManager.clear();
    const tasks: Record<string, (value?: unknown) => unknown> = {};
    const on = (_event: 'task', map: Record<string, (value?: unknown) => unknown>) => {
      Object.assign(tasks, map);
    };
    metadata(on);
    expect(typeof tasks.qaTitle).toBe('function');
    expect(tasks.qaTitle?.('AUTH-101')).toBe(null);
    expect(MetadataManager.getEntries()).toEqual([
      { type: 'qa-title', body: 'AUTH-101' },
    ]);
  });

  qaItAuto('qa.step rejects async callbacks (FR64)', () => {
    MetadataManager.clear();
    expect(() =>
        qa.step('bad', () => {
          return Promise.resolve() as unknown as void;
        })).toThrow(/synchronous callback/);
  });

  qaItAuto('qa helpers record sync step metadata without Cypress', () => {
    MetadataManager.clear();
    qa.suite('Login');
    qa.step('open', () => {
      // sync only
    });
    const entries = MetadataManager.getEntries();
    expect(entries.some((e) => e.type === 'qa-suite' && e.body === 'Login')).toBeTruthy();
    expect(entries.some((e) => e.type === 'qa-step' && e.body === 'open')).toBeTruthy();
    expect(entries.some(
        (e) =>
          e.type === 'qa-step-end' &&
          (e.body as { status: string }).status === 'passed',
      ),).toBeTruthy();
  });
});
