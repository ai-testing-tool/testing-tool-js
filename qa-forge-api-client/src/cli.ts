#!/usr/bin/env node
import { readFileSync } from 'fs';
import { resolve } from 'path';

import {
  IngestClient,
  buildIngestPayload,
  detectCiEnvironment,
  envToConfig,
  loadConfig,
  composeOptions,
  type IngestFormat,
  type JestVitestJsonReport,
} from 'qa-forge-commons';

type CliArgs = {
  project?: string;
  report?: string;
  url?: string;
  token?: string;
  launch?: string;
  plan?: string;
  planId?: string;
  planKey?: string;
  fixVersion?: string;
  sprint?: string;
  format?: IngestFormat;
  help?: boolean;
};

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg === '--help' || arg === '-h') args.help = true;
    if ((arg === '--project' || arg === '-p') && next) {
      args.project = next;
      i += 1;
    }
    if ((arg === '--report' || arg === '-r') && next) {
      args.report = next;
      i += 1;
    }
    if (arg === '--url' && next) {
      args.url = next;
      i += 1;
    }
    if (arg === '--token' && next) {
      args.token = next;
      i += 1;
    }
    if ((arg === '--launch' || arg === '-l') && next) {
      args.launch = next;
      i += 1;
    }
    if (arg === '--plan' && next) {
      args.plan = next;
      i += 1;
    }
    if (arg === '--plan-id' && next) {
      args.planId = next;
      i += 1;
    }
    if (arg === '--plan-key' && next) {
      args.planKey = next;
      i += 1;
    }
    if (arg === '--fix-version' && next) {
      args.fixVersion = next;
      i += 1;
    }
    if (arg === '--sprint' && next) {
      args.sprint = next;
      i += 1;
    }
    if (arg === '--format' && next) {
      args.format = next as IngestFormat;
      i += 1;
    }
  }
  return args;
}

function printHelp(): void {
  console.log(`qa-forge-api-client

Usage:
  qa-forge-api-client --project <KEY> --report <path>
  qa-forge-api-client --project <KEY> --report results.xml --format junit-xml

Options:
  --project, -p   Jira project key
  --report, -r    Path to Jest/Vitest JSON (default) or JUnit XML with --format junit-xml
  --format        jest-json (default) | vitest-json | junit-xml
                  Note: JUnit XML is optional/secondary; Jest/Vitest JSON remains primary (FR41).
  --url           Ingest URL (or QANALYZER_INGEST_URL)
  --token         Bearer token (or QANALYZER_INGEST_TOKEN)
  --launch, -l    Launch display name
  --plan          Test Plan name (or QANALYZER_PLAN_NAME)
  --plan-id       Test Plan UUID (or QANALYZER_PLAN_ID)
  --plan-key      Test Plan slug (or QANALYZER_PLAN_KEY)
  --fix-version  Fix version tag (or QANALYZER_FIX_VERSION)
  --sprint        Sprint name tag (or QANALYZER_SPRINT)
  --help          Show this help
`);
}

function readText(path: string): string {
  const absolute = resolve(process.cwd(), path);
  return readFileSync(absolute, 'utf8');
}

function readJsonReport(path: string): JestVitestJsonReport {
  return JSON.parse(readText(path)) as JestVitestJsonReport;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || process.argv.length <= 2) {
    printHelp();
    process.exit(args.help ? 0 : 1);
  }

  const fileConfig = loadConfig() ?? {};
  const envConfig = envToConfig();
  const merged = composeOptions(fileConfig, envConfig);
  const projectKey = args.project ?? merged.projectKey;
  if (!projectKey) {
    console.error('Missing --project (or projectKey in qanalyzer.config.json / QANALYZER_PROJECT_KEY)');
    process.exit(1);
  }

  const reportPath = args.report ?? './qanalyzer-results.json';
  const format: IngestFormat = args.format ?? 'jest-json';
  const report =
    format === 'junit-xml' ? readText(reportPath) : readJsonReport(reportPath);

  // CLI flags override env (FR158)
  const payload = buildIngestPayload({
    projectKey,
    report,
    format,
    launchName: args.launch ?? merged.launchName,
    planId: args.planId ?? merged.planId,
    planKey: args.planKey ?? merged.planKey,
    planName: args.plan ?? merged.planName,
    fixVersion: args.fixVersion ?? merged.fixVersion,
    sprintName: args.sprint ?? merged.sprintName,
    ci: detectCiEnvironment(),
  });

  const client = new IngestClient({
    url: args.url ?? merged.ingest?.url,
    token: args.token ?? merged.ingest?.token,
    timeoutMs: merged.ingest?.timeoutMs,
    maxPayloadBytes: merged.ingest?.maxPayloadBytes,
  });

  const response = await client.send(payload);
  console.log(JSON.stringify({ ok: true, status: response.status, body: response.body }));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
