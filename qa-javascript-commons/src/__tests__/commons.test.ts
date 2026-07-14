import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { ConfigType } from '../config';
import { composeOptions } from '../options/compose-options';
import { buildIngestPayload } from '../models/ingest-payload';
import { envToConfig } from '../env/env-to-config';
import { createDefaultConfig } from '../qanalyzer/options-resolver';

describe('composeOptions', () => {
  it('skips undefined values from later sources', () => {
    const merged = composeOptions<ConfigType>(
      { mode: 'off', projectKey: 'AUTH' },
      { launchName: 'ci #1' },
    );
    assert.equal(merged.mode, 'off');
    assert.equal(merged.projectKey, 'AUTH');
    assert.equal(merged.launchName, 'ci #1');
  });
});

describe('buildIngestPayload', () => {
  it('wraps Jest JSON with FR41 metadata', () => {
    const payload = buildIngestPayload({
      projectKey: 'AUTH',
      launchName: 'local',
      report: {
        numTotalTests: 1,
        testResults: [{ name: 'suite.test.ts', assertionResults: [] }],
      },
      ci: { ciPlatform: 'github', buildUrl: 'https://example/run/1' },
    });

    assert.equal(payload.projectKey, 'AUTH');
    assert.equal(payload.launchName, 'local');
    assert.equal(payload.ciPlatform, 'github');
    assert.deepEqual(payload.report.testResults, [
      { name: 'suite.test.ts', assertionResults: [] },
    ]);
  });

  it('includes optional fixVersion and sprintName (FR21)', () => {
    const payload = buildIngestPayload({
      projectKey: 'AUTH',
      report: { numTotalTests: 0, testResults: [] },
      fixVersion: ' 2.4.0 ',
      sprintName: 'Sprint 42',
    });
    assert.equal(payload.fixVersion, '2.4.0');
    assert.equal(payload.sprintName, 'Sprint 42');
  });

  it('builds junit-xml payload with XML string report (FR45)', () => {
    const xml = '<testsuite name="T"><testcase name="a" classname="c"/></testsuite>';
    const payload = buildIngestPayload({
      projectKey: 'AUTH',
      format: 'junit-xml',
      report: xml,
    });
    assert.equal(payload.format, 'junit-xml');
    assert.equal(payload.report, xml);
  });
});

describe('envToConfig version tags', () => {
  it('maps QANALYZER_FIX_VERSION and QANALYZER_SPRINT', () => {
    const prevFix = process.env.QANALYZER_FIX_VERSION;
    const prevSprint = process.env.QANALYZER_SPRINT;
    process.env.QANALYZER_FIX_VERSION = '2.4.0';
    process.env.QANALYZER_SPRINT = 'Sprint 42';
    try {
      const config = envToConfig();
      assert.equal(config.fixVersion, '2.4.0');
      assert.equal(config.sprintName, 'Sprint 42');
    } finally {
      if (prevFix === undefined) delete process.env.QANALYZER_FIX_VERSION;
      else process.env.QANALYZER_FIX_VERSION = prevFix;
      if (prevSprint === undefined) delete process.env.QANALYZER_SPRINT;
      else process.env.QANALYZER_SPRINT = prevSprint;
    }
  });
});

describe('createDefaultConfig', () => {
  it('defaults to mode off with ingest limits', () => {
    const config = createDefaultConfig();
    assert.equal(config.mode, 'off');
    assert.equal(config.ingest?.maxPayloadBytes, 4_500_000);
  });

  it('merges env overrides last', () => {
    const previous = process.env.QANALYZER_PROJECT_KEY;
    process.env.QANALYZER_PROJECT_KEY = 'DEMO';
    try {
      const merged = composeOptions(createDefaultConfig(), envToConfig());
      assert.equal(merged.projectKey, 'DEMO');
    } finally {
      if (previous === undefined) {
        delete process.env.QANALYZER_PROJECT_KEY;
      } else {
        process.env.QANALYZER_PROJECT_KEY = previous;
      }
    }
  });
});
