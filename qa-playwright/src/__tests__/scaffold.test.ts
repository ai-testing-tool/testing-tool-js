import { qaDescribe, qaItAuto, expect } from '@qa/test';

import { ModeEnum, QAnalyzerReporter } from '@qanalyzer/forge-commons';

import { MetadataManager, qa } from '../helpers.js';
import { PlaywrightQaReporter } from '../reporter.js';
import PlaywrightQaReporterDefault from '../index.js';

qaDescribe('@qanalyzer/forge-playwright scaffold', () => {
  qaItAuto('loads reporter module and no-ops publish when mode=off', async () => {
    QAnalyzerReporter.resetInstance();

    const reporter = new PlaywrightQaReporter({
      mode: ModeEnum.off,
      projectKey: 'AUTH',
    });
    expect(reporter).toBeTruthy();
    expect(PlaywrightQaReporterDefault).toBe(PlaywrightQaReporter);

    reporter.onBegin({} as never, {} as never);
    reporter.onTestEnd({} as never, {} as never);
    await reporter.onEnd({} as never);

    const instance = QAnalyzerReporter.getInstance({ mode: ModeEnum.off });
    expect(instance.getConfig().mode).toBe(ModeEnum.off);
  });

  qaItAuto('qa helpers record metadata without Playwright context', () => {
    MetadataManager.clear();
    qa.suite('E-commerce\tLogin');
    qa.fields({ layer: 'e2e' });
    qa.parameters({ user: 'standard_user' });
    qa.comment('ok');
    qa.ignore();
    qa.attach({ name: 'note.txt', contentType: 'text/plain' });

    const entries = MetadataManager.getEntries();
    expect(entries.some((e) => e.type === 'qa-suite' && e.body === 'E-commerce\tLogin')).toBeTruthy();
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
