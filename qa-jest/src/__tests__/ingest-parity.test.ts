import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import {
  ModeEnum,
  QAnalyzerReporter,
  buildIngestPayload,
  type IngestPayload,
} from 'qa-javascript-commons';

import { JestQaReporter } from '../index.js';
import { toJestJsonReport, type AggregatedResultLike } from '../report-builder.js';

/** Same logical run as AggregatedResult (onRunComplete) vs native --json output. */
const AGGREGATED: AggregatedResultLike = {
  startTime: 1_700_000_000_000,
  success: false,
  numTotalTestSuites: 1,
  numPassedTestSuites: 0,
  numFailedTestSuites: 1,
  numPendingTestSuites: 0,
  numTotalTests: 2,
  numPassedTests: 1,
  numFailedTests: 1,
  numPendingTests: 0,
  numTodoTests: 0,
  testResults: [
    {
      testFilePath: '/tests/auth.test.js',
      status: 'failed',
      startTime: 1_700_000_000_000,
      endTime: 1_700_000_000_050,
      testResults: [
        {
          ancestorTitles: ['Auth'],
          fullName: 'Auth AUTH-101 login',
          title: 'AUTH-101 login',
          status: 'passed',
          duration: 12,
          failureMessages: [],
        },
        {
          ancestorTitles: ['Auth'],
          fullName: 'Auth AUTH-102 logout',
          title: 'AUTH-102 logout',
          status: 'failed',
          duration: 8,
          failureMessages: ['Expected 200'],
        },
      ],
    },
  ],
};

const NATIVE_JSON: AggregatedResultLike = {
  startTime: 1_700_000_000_000,
  success: false,
  numTotalTestSuites: 1,
  numPassedTestSuites: 0,
  numFailedTestSuites: 1,
  numPendingTestSuites: 0,
  numTotalTests: 2,
  numPassedTests: 1,
  numFailedTests: 1,
  numPendingTests: 0,
  numTodoTests: 0,
  testResults: [
    {
      name: '/tests/auth.test.js',
      status: 'failed',
      startTime: 1_700_000_000_000,
      endTime: 1_700_000_000_050,
      assertionResults: [
        {
          ancestorTitles: ['Auth'],
          fullName: 'Auth AUTH-101 login',
          title: 'AUTH-101 login',
          status: 'passed',
          duration: 12,
          failureMessages: [],
        },
        {
          ancestorTitles: ['Auth'],
          fullName: 'Auth AUTH-102 logout',
          title: 'AUTH-102 logout',
          status: 'failed',
          duration: 8,
          failureMessages: ['Expected 200'],
        },
      ],
    },
  ],
};

function assertionFingerprint(payload: IngestPayload): string[] {
  const rows: string[] = [];
  const report =
    typeof payload.report === 'object' && payload.report
      ? payload.report
      : null;
  for (const file of report?.testResults ?? []) {
    for (const a of file.assertionResults ?? []) {
      rows.push(`${file.name}|${a.fullName}|${a.title}|${a.status}`);
    }
  }
  return rows.sort();
}

describe('dual-path FR41 parity (NFR24)', () => {
  it('AggregatedResult and native --json yield schema-equivalent payloads', () => {
    const fromReporter = buildIngestPayload({
      projectKey: 'AUTH',
      report: toJestJsonReport(AGGREGATED),
      format: 'jest-json',
      launchName: 'ci #1',
    });
    const fromCli = buildIngestPayload({
      projectKey: 'AUTH',
      report: toJestJsonReport(NATIVE_JSON),
      format: 'jest-json',
      launchName: 'ci #1',
    });

    assert.equal(fromReporter.format, 'jest-json');
    assert.equal(fromCli.format, 'jest-json');
    assert.equal(fromReporter.projectKey, fromCli.projectKey);
    assert.equal(fromReporter.launchName, fromCli.launchName);
    assert.equal(fromReporter.report.numTotalTests, fromCli.report.numTotalTests);
    assert.equal(fromReporter.report.numPassedTests, fromCli.report.numPassedTests);
    assert.equal(fromReporter.report.numFailedTests, fromCli.report.numFailedTests);
    assert.equal(fromReporter.report.success, fromCli.report.success);
    assert.deepEqual(assertionFingerprint(fromReporter), assertionFingerprint(fromCli));
  });
});

describe('mode=file publish', () => {
  it('writes FR41 payload with format jest-json', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'qa-jest-'));
    const out = join(dir, 'qanalyzer-results.json');

    try {
      QAnalyzerReporter.resetInstance();
      const reporter = QAnalyzerReporter.getInstance({
        mode: ModeEnum.file,
        projectKey: 'AUTH',
        launchName: 'local',
        file: { path: out },
      });

      const payload = await reporter.publishReport(toJestJsonReport(AGGREGATED), {
        format: 'jest-json',
      });

      assert.ok(payload);
      assert.equal(payload.format, 'jest-json');

      const written = JSON.parse(readFileSync(out, 'utf8')) as IngestPayload;
      assert.equal(written.format, 'jest-json');
      assert.equal(written.projectKey, 'AUTH');
      assert.equal(written.report.testResults?.[0]?.assertionResults?.[0]?.title, 'AUTH-101 login');
    } finally {
      QAnalyzerReporter.resetInstance();
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('JestQaReporter modes', () => {
  it('mode=off completes without credentials', async () => {
    const reporter = new JestQaReporter({}, { mode: ModeEnum.off });
    await reporter.onRunComplete(new Set(), AGGREGATED);
  });

  it('overrides stale success=false from onRunComplete when nothing failed', async () => {
    // Jest sets aggregatedResults.success after reporters run, so an all-green
    // run still hands reporters success=false. The published report must not
    // mirror that stale value.
    const allPassing: AggregatedResultLike = {
      startTime: 1_700_000_000_000,
      success: false,
      numTotalTestSuites: 1,
      numPassedTestSuites: 1,
      numFailedTestSuites: 0,
      numPendingTestSuites: 0,
      numTotalTests: 1,
      numPassedTests: 1,
      numFailedTests: 0,
      numPendingTests: 0,
      numTodoTests: 0,
      testResults: [
        {
          testFilePath: '/tests/auth.test.js',
          status: 'passed',
          testResults: [
            {
              ancestorTitles: ['Auth'],
              fullName: 'Auth AUTH-101 login',
              title: 'AUTH-101 login',
              status: 'passed',
              duration: 12,
              failureMessages: [],
            },
          ],
        },
      ],
    };

    const dir = mkdtempSync(join(tmpdir(), 'qa-jest-success-'));
    const out = join(dir, 'out.json');

    try {
      const reporter = new JestQaReporter(
        {},
        {
          mode: ModeEnum.file,
          projectKey: 'AUTH',
          file: { path: out },
        },
      );
      await reporter.onRunComplete(new Set(), allPassing);

      const written = JSON.parse(readFileSync(out, 'utf8')) as IngestPayload;
      const report = typeof written.report === 'object' ? written.report : null;
      assert.equal(report?.success, true);
    } finally {
      QAnalyzerReporter.resetInstance();
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('keeps success=false via reporter when the run has failures', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'qa-jest-fail-'));
    const out = join(dir, 'out.json');

    try {
      const reporter = new JestQaReporter(
        {},
        {
          mode: ModeEnum.file,
          projectKey: 'AUTH',
          file: { path: out },
        },
      );
      await reporter.onRunComplete(new Set(), AGGREGATED);

      const written = JSON.parse(readFileSync(out, 'utf8')) as IngestPayload;
      const report = typeof written.report === 'object' ? written.report : null;
      assert.equal(report?.success, false);
    } finally {
      QAnalyzerReporter.resetInstance();
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('mode=file via reporter writes payload', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'qa-jest-rep-'));
    const out = join(dir, 'out.json');

    try {
      const reporter = new JestQaReporter(
        {},
        {
          mode: ModeEnum.file,
          projectKey: 'AUTH',
          file: { path: out },
        },
      );
      await reporter.onRunComplete(new Set(), AGGREGATED);

      const written = JSON.parse(readFileSync(out, 'utf8')) as IngestPayload;
      assert.equal(written.format, 'jest-json');
      assert.equal(written.projectKey, 'AUTH');
    } finally {
      QAnalyzerReporter.resetInstance();
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
