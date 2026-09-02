import { qaDescribe, qaItAuto, expect } from '@qa/test';

import type { ConfigType } from '../config';
import { composeOptions } from '../options/compose-options';
import { buildIngestPayload } from '../models/ingest-payload';
import { envToConfig } from '../env/env-to-config';
import { createDefaultConfig } from '../qanalyzer/options-resolver';

qaDescribe('composeOptions', () => {
  qaItAuto('skips undefined values from later sources', () => {
    const merged = composeOptions<ConfigType>(
      { mode: 'off', projectKey: 'AUTH' },
      { launchName: 'ci #1' },
    );
    expect(merged.mode).toBe('off');
    expect(merged.projectKey).toBe('AUTH');
    expect(merged.launchName).toBe('ci #1');
  });
});

qaDescribe('buildIngestPayload', () => {
  qaItAuto('wraps Jest JSON with FR41 metadata', () => {
    const payload = buildIngestPayload({
      projectKey: 'AUTH',
      launchName: 'local',
      report: {
        numTotalTests: 1,
        testResults: [{ name: 'suite.test.ts', assertionResults: [] }],
      },
      ci: { ciPlatform: 'github', buildUrl: 'https://example/run/1' },
    });

    expect(payload.projectKey).toBe('AUTH');
    expect(payload.launchName).toBe('local');
    expect(payload.ciPlatform).toBe('github');
    expect(payload.report.testResults).toEqual([
      { name: 'suite.test.ts', assertionResults: [] },
    ]);
  });

  qaItAuto('includes optional fixVersion and sprintName (FR21)', () => {
    const payload = buildIngestPayload({
      projectKey: 'AUTH',
      report: { numTotalTests: 0, testResults: [] },
      fixVersion: ' 2.4.0 ',
      sprintName: 'Sprint 42',
    });
    expect(payload.fixVersion).toBe('2.4.0');
    expect(payload.sprintName).toBe('Sprint 42');
  });

});

qaDescribe('envToConfig ingest retry', () => {
  qaItAuto('maps QANALYZER_INGEST_MAX_RETRIES and QANALYZER_INGEST_RETRY_BASE_DELAY_MS', () => {
    const prevRetries = process.env.QANALYZER_INGEST_MAX_RETRIES;
    const prevDelay = process.env.QANALYZER_INGEST_RETRY_BASE_DELAY_MS;
    process.env.QANALYZER_INGEST_MAX_RETRIES = '5';
    process.env.QANALYZER_INGEST_RETRY_BASE_DELAY_MS = '2000';
    try {
      const config = envToConfig();
      expect(config.ingest?.maxRetries).toBe(5);
      expect(config.ingest?.retryBaseDelayMs).toBe(2000);
    } finally {
      if (prevRetries === undefined) delete process.env.QANALYZER_INGEST_MAX_RETRIES;
      else process.env.QANALYZER_INGEST_MAX_RETRIES = prevRetries;
      if (prevDelay === undefined) delete process.env.QANALYZER_INGEST_RETRY_BASE_DELAY_MS;
      else process.env.QANALYZER_INGEST_RETRY_BASE_DELAY_MS = prevDelay;
    }
  });
});

qaDescribe('envToConfig version tags', () => {
  qaItAuto('maps QANALYZER_FIX_VERSION and QANALYZER_SPRINT', () => {
    const prevFix = process.env.QANALYZER_FIX_VERSION;
    const prevSprint = process.env.QANALYZER_SPRINT;
    process.env.QANALYZER_FIX_VERSION = '2.4.0';
    process.env.QANALYZER_SPRINT = 'Sprint 42';
    try {
      const config = envToConfig();
      expect(config.fixVersion).toBe('2.4.0');
      expect(config.sprintName).toBe('Sprint 42');
    } finally {
      if (prevFix === undefined) delete process.env.QANALYZER_FIX_VERSION;
      else process.env.QANALYZER_FIX_VERSION = prevFix;
      if (prevSprint === undefined) delete process.env.QANALYZER_SPRINT;
      else process.env.QANALYZER_SPRINT = prevSprint;
    }
  });
});

qaDescribe('createDefaultConfig', () => {
  qaItAuto('defaults to mode off with ingest limits', () => {
    const config = createDefaultConfig();
    expect(config.mode).toBe('off');
    expect(config.ingest?.maxPayloadBytes).toBe(4_500_000);
    expect(config.ingest?.timeoutMs).toBe(60_000);
    expect(config.ingest?.completeTimeoutMs).toBe(120_000);
    expect(config.ingest?.chunkThresholdBytes).toBe(3_500_000);
    expect(config.ingest?.chunkMaxBytes).toBe(3_000_000);
    expect(config.ingest?.maxRetries).toBe(4);
  });

  qaItAuto('merges env overrides last', () => {
    const previous = process.env.QANALYZER_PROJECT_KEY;
    process.env.QANALYZER_PROJECT_KEY = 'DEMO';
    try {
      const merged = composeOptions(createDefaultConfig(), envToConfig());
      expect(merged.projectKey).toBe('DEMO');
    } finally {
      if (previous === undefined) {
        delete process.env.QANALYZER_PROJECT_KEY;
      } else {
        process.env.QANALYZER_PROJECT_KEY = previous;
      }
    }
  });
});
