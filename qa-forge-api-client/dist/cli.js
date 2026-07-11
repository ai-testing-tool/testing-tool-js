#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
const qa_javascript_commons_1 = require("qa-javascript-commons");
function parseArgs(argv) {
    const args = {};
    for (let i = 0; i < argv.length; i += 1) {
        const arg = argv[i];
        const next = argv[i + 1];
        if (arg === '--help' || arg === '-h')
            args.help = true;
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
    }
    return args;
}
function printHelp() {
    console.log(`qa-forge-api-client

Usage:
  qa-forge-api-client --project <KEY> --report <path>

Options:
  --project, -p   Jira project key
  --report, -r    Path to Jest/Vitest JSON (default: ./qanalyzer-results.json)
  --url           Ingest URL (or QANALYZER_INGEST_URL)
  --token         Bearer token (or QANALYZER_INGEST_TOKEN)
  --launch, -l    Launch display name
  --help          Show this help
`);
}
function readReport(path) {
    const absolute = (0, path_1.resolve)(process.cwd(), path);
    const raw = (0, fs_1.readFileSync)(absolute, 'utf8');
    return JSON.parse(raw);
}
async function main() {
    const args = parseArgs(process.argv.slice(2));
    if (args.help || process.argv.length <= 2) {
        printHelp();
        process.exit(args.help ? 0 : 1);
    }
    const fileConfig = (0, qa_javascript_commons_1.loadConfig)() ?? {};
    const envConfig = (0, qa_javascript_commons_1.envToConfig)();
    const merged = (0, qa_javascript_commons_1.composeOptions)(fileConfig, envConfig);
    const projectKey = args.project ?? merged.projectKey;
    if (!projectKey) {
        console.error('Missing --project (or projectKey in qanalyzer.config.json / QANALYZER_PROJECT_KEY)');
        process.exit(1);
    }
    const reportPath = args.report ?? './qanalyzer-results.json';
    const report = readReport(reportPath);
    const payload = (0, qa_javascript_commons_1.buildIngestPayload)({
        projectKey,
        report,
        launchName: args.launch ?? merged.launchName,
        ci: (0, qa_javascript_commons_1.detectCiEnvironment)(),
    });
    const client = new qa_javascript_commons_1.IngestClient({
        url: args.url ?? merged.ingest?.url,
        token: args.token ?? merged.ingest?.token,
        timeoutMs: merged.ingest?.timeoutMs,
        maxPayloadBytes: merged.ingest?.maxPayloadBytes,
    });
    const response = await client.send(payload);
    console.log(JSON.stringify({ ok: true, status: response.status, body: response.body }));
}
main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
});
