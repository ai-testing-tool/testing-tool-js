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

  qaItAuto('builds junit-xml payload with XML string report (FR45)', () => {
    const xml = '<testsuite name="T"><testcase name="a" classname="c"/></testsuite>';
    const payload = buildIngestPayload({
      projectKey: 'AUTH',
      format: 'junit-xml',
      report: xml,
    });
    expect(payload.format).toBe('junit-xml');
    expect(payload.report).toBe(xml);
  });
});

qaDescribe('envToConfig ingest gateway', () => {
  qaItAuto('maps QANALYZER_FORGE_INGEST_URL and QANALYZER_FORGE_INGEST_TOKEN', () => {
    const prevUrl = process.env.QANALYZER_FORGE_INGEST_URL;
    const prevToken = process.env.QANALYZER_FORGE_INGEST_TOKEN;
    process.env.QANALYZER_FORGE_INGEST_URL = 'https://forge.example/webtrigger';
    process.env.QANALYZER_FORGE_INGEST_TOKEN = 'forge-token';
    try {
      const config = envToConfig();
      expect(config.ingest?.forgeIngestUrl).toBe('https://forge.example/webtrigger');
      expect(config.ingest?.forgeIngestToken).toBe('forge-token');
    } finally {
      if (prevUrl === undefined) delete process.env.QANALYZER_FORGE_INGEST_URL;
      else process.env.QANALYZER_FORGE_INGEST_URL = prevUrl;
      if (prevToken === undefined) delete process.env.QANALYZER_FORGE_INGEST_TOKEN;
      else process.env.QANALYZER_FORGE_INGEST_TOKEN = prevToken;
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
