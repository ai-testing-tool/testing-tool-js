import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { describe, it } from 'node:test';

import { ModeEnum, QAnalyzerReporter } from 'qa-javascript-commons';

import metadata from '../metadata.js';
import { MetadataManager, qa } from '../mocha.js';
import plugin from '../plugin.js';
import { CypressQaReporter } from '../reporter.js';

describe('qa-cypress scaffold', () => {
  it('loads reporter module and no-ops publish when mode=off', async () => {
    QAnalyzerReporter.resetInstance();

    const runner = new EventEmitter() as EventEmitter & {
      on: EventEmitter['on'];
      once: EventEmitter['once'];
    };

    // Mocha Runner shape: EventEmitter with constants used in constructor
    const reporter = new CypressQaReporter(runner as never, {
      reporterOptions: { mode: ModeEnum.off, projectKey: 'AUTH' },
    });
    assert.ok(reporter);

    runner.emit('test'); // Mocha EVENT_TEST_BEGIN
    runner.emit('end'); // Mocha EVENT_RUN_END

    // Allow async onRunEnd to settle
    await new Promise((r) => setImmediate(r));
    await new Promise((r) => setImmediate(r));

    const instance = QAnalyzerReporter.getInstance({ mode: ModeEnum.off });
    assert.equal(instance.getConfig().mode, ModeEnum.off);
  });

  it('plugin registration does not throw', () => {
    const events: string[] = [];
    const on = (event: string) => {
      events.push(event);
    };
    const config = { projectRoot: '/tmp' };
    const out = plugin(on, config);
    assert.equal(out, config);
    assert.ok(events.includes('before:run'));
    assert.ok(events.includes('after:run'));
    assert.ok(events.includes('after:screenshot'));
  });

  it('metadata registration does not throw and records tasks', () => {
    MetadataManager.clear();
    const tasks: Record<string, (value?: unknown) => unknown> = {};
    const on = (_event: 'task', map: Record<string, (value?: unknown) => unknown>) => {
      Object.assign(tasks, map);
    };
    metadata(on);
    assert.equal(typeof tasks.qaTitle, 'function');
    assert.equal(tasks.qaTitle?.('AUTH-101'), null);
    assert.deepEqual(MetadataManager.getEntries(), [
      { type: 'qa-title', body: 'AUTH-101' },
    ]);
  });

  it('qa.step rejects async callbacks (FR64)', () => {
    MetadataManager.clear();
    assert.throws(
      () =>
        qa.step('bad', () => {
          return Promise.resolve() as unknown as void;
        }),
      /synchronous callback/,
    );
  });

  it('qa helpers record sync step metadata without Cypress', () => {
    MetadataManager.clear();
    qa.suite('Login');
    qa.step('open', () => {
      // sync only
    });
    const entries = MetadataManager.getEntries();
    assert.ok(entries.some((e) => e.type === 'qa-suite' && e.body === 'Login'));
    assert.ok(entries.some((e) => e.type === 'qa-step' && e.body === 'open'));
    assert.ok(
      entries.some(
        (e) =>
          e.type === 'qa-step-end' &&
          (e.body as { status: string }).status === 'passed',
      ),
    );
  });
});
