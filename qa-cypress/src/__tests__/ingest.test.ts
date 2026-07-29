import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { qaDescribe, qaItAuto, expect } from '@qa/test';

import {
  ModeEnum,
  QAnalyzerReporter,
  type IngestPayload,
} from '@qanalyzer/forge-commons';

import plugin from '../plugin.js';
import { toJestJsonReport, type CypressSpecInput } from '../report-builder.js';
import { resolveQaOptions } from '../resolve-options.js';
import { ResultsManager } from '../results-manager.js';

const SPECS: CypressSpecInput[] = [
  {
    name: 'cypress/e2e/login.cy.js',
    assertions: [
      {
        ancestorTitles: ['Login Scenarios'],
        title: 'AUTH-101 login',
        status: 'passed',
        duration: 12,
        failureMessages: [],
      },
      {
        ancestorTitles: ['Login Scenarios'],
        title: 'AUTH-102 logout',
        status: 'failed',
        duration: 8,
        failureMessages: ['Expected 200'],
      },
    ],
  },
];

qaDescribe('resolveQaOptions', () => {
  qaItAuto('unwraps cypress-multi-reporters qaCypressReporterOptions', () => {
    const opts = resolveQaOptions({
      reporterEnabled: '@qanalyzer/forge-cypress',
      qaCypressReporterOptions: { mode: 'file', projectKey: 'AUTH' },
    });
    expect(opts.mode).toBe('file');
    expect(opts.projectKey).toBe('AUTH');
  });

  qaItAuto('accepts direct reporter options', () => {
    const opts = resolveQaOptions({ mode: 'ingest', projectKey: 'DEMO' });
    expect(opts.mode).toBe('ingest');
    expect(opts.projectKey).toBe('DEMO');
  });
});

qaDescribe('mode=file publish', () => {
  qaItAuto('writes FR41 payload with format jest-json', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'qa-cypress-'));
    const out = join(dir, 'qanalyzer-results.json');

    try {
      QAnalyzerReporter.resetInstance();
      const reporter = QAnalyzerReporter.getInstance({
        mode: ModeEnum.file,
        projectKey: 'AUTH',
        launchName: 'local',
        file: { path: out },
      });

      const payload = await reporter.publishReport(toJestJsonReport(SPECS), {
        format: 'jest-json',
      });

      expect(payload).toBeTruthy();
      expect(payload.format).toBe('jest-json');

      const written = JSON.parse(readFileSync(out, 'utf8')) as IngestPayload;
      expect(written.format).toBe('jest-json');
      expect(written.projectKey).toBe('AUTH');
      expect(written.report.testResults?.[0]?.assertionResults?.[0]?.title).toBe('AUTH-101 login',);
    } finally {
      QAnalyzerReporter.resetInstance();
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

qaDescribe('ResultsManager + plugin after:run', () => {
  qaItAuto('mode=file via plugin publishes buffered specs', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'qa-cypress-bridge-'));
    const bridge = join(dir, 'bridge.json');
    const out = join(dir, 'out.json');

    try {
      delete process.env.QANALYZER_CYPRESS_RESULTS_PATH;
      ResultsManager.clear(bridge);
      ResultsManager.appendSpec(SPECS[0]!, bridge);

      const handlers = new Map<string, (...args: unknown[]) => unknown>();
      const on = (event: string, handler: (...args: unknown[]) => unknown) => {
        handlers.set(event, handler);
      };

      plugin(on, {
        projectRoot: dir,
        reporterOptions: {
          qaCypressReporterOptions: {
            mode: ModeEnum.file,
            projectKey: 'AUTH',
            resultsPath: bridge,
            file: { path: out },
          },
        },
      });

      const afterRun = handlers.get('after:run');
      expect(afterRun).toBeTruthy();
      await afterRun();

      const written = JSON.parse(readFileSync(out, 'utf8')) as IngestPayload;
      expect(written.format).toBe('jest-json');
      expect(written.projectKey).toBe('AUTH');
      expect(written.report.numTotalTests).toBe(2);
      expect(written.report.numFailedTests).toBe(1);
    } finally {
      QAnalyzerReporter.resetInstance();
      delete process.env.QANALYZER_CYPRESS_RESULTS_PATH;
      rmSync(dir, { recursive: true, force: true });
    }
  });

  qaItAuto('mode=off after:run clears bridge without writing', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'qa-cypress-off-'));
    const bridge = join(dir, 'bridge.json');

    try {
      ResultsManager.appendSpec(SPECS[0]!, bridge);
      expect(ResultsManager.getSpecs(bridge).length).toBe(1);

      const handlers = new Map<string, (...args: unknown[]) => unknown>();
      const on = (event: string, handler: (...args: unknown[]) => unknown) => {
        handlers.set(event, handler);
      };

      plugin(on, {
        reporterOptions: {
          mode: ModeEnum.off,
          projectKey: 'AUTH',
          resultsPath: bridge,
        },
      });

      await handlers.get('after:run')?.();
      expect(ResultsManager.getSpecs(bridge).length).toBe(0);
    } finally {
      QAnalyzerReporter.resetInstance();
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
