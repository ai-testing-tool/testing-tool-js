import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { qaDescribe, qaItAuto, expect } from '@qa/test';

const pkgRoot = join(fileURLToPath(import.meta.url), '..', '..', '..');
const cliPath = join(pkgRoot, 'dist', 'cli.js');

function runCli(args: string[], cwd?: string) {
  return spawnSync(process.execPath, [cliPath, ...args], {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, QANALYZER_MODE: 'off' },
  });
}

qaDescribe('@qanalyzer/forge-api-client CLI', () => {
  qaItAuto('prints help and exits 0', () => {
    const result = runCli(['--help']);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('@qanalyzer/forge-api-client');
    expect(result.stdout).toContain('--project');
  });

  qaItAuto('requires --project when uploading a report', () => {
    const dir = mkdtempSync(join(tmpdir(), 'qa-cli-'));
    const reportPath = join(dir, 'qanalyzer-results.json');
    writeFileSync(
      reportPath,
      JSON.stringify({
        numTotalTests: 1,
        numPassedTests: 1,
        numFailedTests: 0,
        success: true,
        testResults: [],
      }),
    );

    try {
      const result = runCli(['--report', reportPath], dir);
      expect(result.status).toBe(1);
      expect(result.stderr).toMatch(/Missing --project/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  qaItAuto('builds payload from jest-json report (dry — no network)', () => {
    const dir = mkdtempSync(join(tmpdir(), 'qa-cli-'));
    const reportPath = join(dir, 'qanalyzer-results.json');
    writeFileSync(
      reportPath,
      JSON.stringify({
        numTotalTests: 1,
        numPassedTests: 1,
        numFailedTests: 0,
        success: true,
        testResults: [
          {
            name: 'auth.test.ts',
            assertionResults: [
              {
                ancestorTitles: ['Auth'],
                title: 'AUTH-101 login',
                status: 'passed',
                failureMessages: [],
              },
            ],
          },
        ],
      }),
    );

    try {
      const result = runCli(
        [
          '--project',
          'AUTH',
          '--launch',
          'cli unit',
          '--report',
          reportPath,
          '--url',
          'http://127.0.0.1:9/nope',
          '--token',
          'qa_test_token',
        ],
        dir,
      );
      expect(result.status).not.toBe(0);
      expect(result.stderr + result.stdout).toMatch(/timed out|ECONNREFUSED|fetch failed/i);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
