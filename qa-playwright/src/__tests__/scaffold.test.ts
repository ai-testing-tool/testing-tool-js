import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { ModeEnum, QAnalyzerReporter } from '@qanalyzer/forge-commons';

import { MetadataManager, qa } from '../helpers.js';
import { PlaywrightQaReporter } from '../reporter.js';
import PlaywrightQaReporterDefault from '../index.js';

describe('@qanalyzer/forge-playwright scaffold', () => {
  it('loads reporter module and no-ops publish when mode=off', async () => {
    QAnalyzerReporter.resetInstance();

    const reporter = new PlaywrightQaReporter({
      mode: ModeEnum.off,
      projectKey: 'AUTH',
    });
    assert.ok(reporter);
    assert.equal(PlaywrightQaReporterDefault, PlaywrightQaReporter);

    reporter.onBegin({} as never, {} as never);
    reporter.onTestEnd({} as never, {} as never);
    await reporter.onEnd({} as never);

    const instance = QAnalyzerReporter.getInstance({ mode: ModeEnum.off });
    assert.equal(instance.getConfig().mode, ModeEnum.off);
  });

  it('qa helpers record metadata without Playwright context', () => {
    MetadataManager.clear();
    qa.suite('E-commerce\tLogin');
    qa.fields({ layer: 'e2e' });
    qa.parameters({ user: 'standard_user' });
    qa.comment('ok');
    qa.ignore();
    qa.attach({ name: 'note.txt', contentType: 'text/plain' });

    const entries = MetadataManager.getEntries();
    assert.ok(entries.some((e) => e.type === 'qa-suite' && e.body === 'E-commerce\tLogin'));
    assert.ok(entries.some((e) => e.type === 'qa-fields'));
    assert.ok(entries.some((e) => e.type === 'qa-parameters'));
    assert.ok(entries.some((e) => e.type === 'qa-comment' && e.body === 'ok'));
    assert.ok(entries.some((e) => e.type === 'qa-ignore'));
    assert.ok(entries.some((e) => e.type === 'qa-attach'));
  });

  it('does not export qa.step (FR112 — use native test.step)', () => {
    assert.equal(
      'step' in qa,
      false,
      'qa.step must not exist — use Playwright test.step()',
    );
  });
});
