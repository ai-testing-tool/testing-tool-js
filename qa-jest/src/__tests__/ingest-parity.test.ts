import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { qaDescribe, qaItAuto, expect } from '@qa/test';

import {
  ModeEnum,
  QAnalyzerReporter,
  buildIngestPayload,
  type IngestPayload,
} from '@qanalyzer/forge-commons';

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

qaDescribe('dual-path FR41 parity (NFR24)', () => {
  qaItAuto('AggregatedResult and native --json yield schema-equivalent payloads', () => {
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

    expect(fromReporter.format).toBe('jest-json');
    expect(fromCli.format).toBe('jest-json');
    expect(fromReporter.projectKey).toBe(fromCli.projectKey);
    expect(fromReporter.launchName).toBe(fromCli.launchName);
    expect(fromReporter.report.numTotalTests).toBe(fromCli.report.numTotalTests);
    expect(fromReporter.report.numPassedTests).toBe(fromCli.report.numPassedTests);
    expect(fromReporter.report.numFailedTests).toBe(fromCli.report.numFailedTests);
    expect(fromReporter.report.success).toBe(fromCli.report.success);
    expect(assertionFingerprint(fromReporter)).toEqual(assertionFingerprint(fromCli));
  });
});

qaDescribe('mode=file publish', () => {
  qaItAuto('writes FR41 payload with format jest-json', async () => {
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

      expect(payload).toBeTruthy();
      expect(payload.format).toBe('jest-json');

      const written = JSON.parse(readFileSync(out, 'utf8')) as IngestPayload;
      expect(written.format).toBe('jest-json');
      expect(written.projectKey).toBe('AUTH');
      expect(written.report.testResults?.[0]?.assertionResults?.[0]?.title).toBe('AUTH-101 login');
    } finally {
      QAnalyzerReporter.resetInstance();
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

qaDescribe('JestQaReporter modes', () => {
  qaItAuto('mode=off completes without credentials', async () => {
    const reporter = new JestQaReporter({}, { mode: ModeEnum.off });
    await reporter.onRunComplete(new Set(), AGGREGATED);
  });

  qaItAuto('overrides stale success=false from onRunComplete when nothing failed', async () => {
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
      expect(report?.success).toBe(true);
    } finally {
      QAnalyzerReporter.resetInstance();
      rmSync(dir, { recursive: true, force: true });
    }
  });

  qaItAuto('keeps success=false via reporter when the run has failures', async () => {
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
      expect(report?.success).toBe(false);
    } finally {
      QAnalyzerReporter.resetInstance();
      rmSync(dir, { recursive: true, force: true });
    }
  });

  qaItAuto('mode=file via reporter writes payload', async () => {
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
      expect(written.format).toBe('jest-json');
      expect(written.projectKey).toBe('AUTH');
    } finally {
      QAnalyzerReporter.resetInstance();
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
