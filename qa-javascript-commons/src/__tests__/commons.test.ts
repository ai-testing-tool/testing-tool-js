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
