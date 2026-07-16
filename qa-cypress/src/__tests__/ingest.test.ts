import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';

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

describe('resolveQaOptions', () => {
  it('unwraps cypress-multi-reporters qaCypressReporterOptions', () => {
    const opts = resolveQaOptions({
      reporterEnabled: '@qanalyzer/forge-cypress',
      qaCypressReporterOptions: { mode: 'file', projectKey: 'AUTH' },
    });
    assert.equal(opts.mode, 'file');
    assert.equal(opts.projectKey, 'AUTH');
  });

  it('accepts direct reporter options', () => {
    const opts = resolveQaOptions({ mode: 'ingest', projectKey: 'DEMO' });
    assert.equal(opts.mode, 'ingest');
    assert.equal(opts.projectKey, 'DEMO');
  });
});

describe('mode=file publish', () => {
  it('writes FR41 payload with format jest-json', async () => {
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

      assert.ok(payload);
      assert.equal(payload.format, 'jest-json');

      const written = JSON.parse(readFileSync(out, 'utf8')) as IngestPayload;
      assert.equal(written.format, 'jest-json');
      assert.equal(written.projectKey, 'AUTH');
      assert.equal(
        written.report.testResults?.[0]?.assertionResults?.[0]?.title,
        'AUTH-101 login',
      );
    } finally {
      QAnalyzerReporter.resetInstance();
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('ResultsManager + plugin after:run', () => {
  it('mode=file via plugin publishes buffered specs', async () => {
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
      assert.ok(afterRun);
      await afterRun();

      const written = JSON.parse(readFileSync(out, 'utf8')) as IngestPayload;
      assert.equal(written.format, 'jest-json');
      assert.equal(written.projectKey, 'AUTH');
      assert.equal(written.report.numTotalTests, 2);
      assert.equal(written.report.numFailedTests, 1);
    } finally {
      QAnalyzerReporter.resetInstance();
      delete process.env.QANALYZER_CYPRESS_RESULTS_PATH;
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('mode=off after:run clears bridge without writing', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'qa-cypress-off-'));
    const bridge = join(dir, 'bridge.json');

    try {
      ResultsManager.appendSpec(SPECS[0]!, bridge);
      assert.equal(ResultsManager.getSpecs(bridge).length, 1);

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
      assert.equal(ResultsManager.getSpecs(bridge).length, 0);
    } finally {
      QAnalyzerReporter.resetInstance();
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
