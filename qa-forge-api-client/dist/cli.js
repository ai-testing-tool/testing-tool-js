#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
const forge_commons_1 = require("@ai-testing-tool/forge-commons");
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
            args.format = next;
            i += 1;
        }
    }
    return args;
}
function printHelp() {
    console.log(`@ai-testing-tool/forge-api-client

Usage:
  @ai-testing-tool/forge-api-client --project <KEY> --report <path>

Options:
  --project, -p   Jira project key
  --report, -r    Path to Jest/Vitest JSON report (default ./ai-testing-tool-results.json)
  --format        jest-json (default) | vitest-json | normalized
  --url           Ingest URL (or AI_TESTING_TOOL_INGEST_URL)
  --token         Bearer token (or AI_TESTING_TOOL_INGEST_TOKEN)
  --launch, -l    Launch display name
  --plan          Test Plan name (or AI_TESTING_TOOL_PLAN_NAME)
  --plan-id       Test Plan UUID (or AI_TESTING_TOOL_PLAN_ID)
  --plan-key      Test Plan slug (or AI_TESTING_TOOL_PLAN_KEY)
  --fix-version  Fix version tag (or AI_TESTING_TOOL_FIX_VERSION)
  --sprint        Sprint name tag (or AI_TESTING_TOOL_SPRINT)
  --help          Show this help
`);
}
function readText(path) {
    const absolute = (0, path_1.resolve)(process.cwd(), path);
    return (0, fs_1.readFileSync)(absolute, 'utf8');
}
function readJsonReport(path) {
    const parsed = JSON.parse(readText(path));
    if (parsed &&
        typeof parsed === 'object' &&
        'report' in parsed &&
        'projectKey' in parsed) {
        return parsed.report;
    }
    return parsed;
}
async function main() {
    const args = parseArgs(process.argv.slice(2));
    if (args.help || process.argv.length <= 2) {
        printHelp();
        process.exit(args.help ? 0 : 1);
    }
    const fileConfig = (0, forge_commons_1.loadConfig)() ?? {};
    const envConfig = (0, forge_commons_1.envToConfig)();
    const merged = (0, forge_commons_1.composeOptions)(fileConfig, envConfig);
    const reportPath = args.report ?? './ai-testing-tool-results.json';
    const format = args.format ?? 'jest-json';
    const raw = readText(reportPath);
    const parsed = JSON.parse(raw);
    const existingPayload = parsed &&
        typeof parsed === 'object' &&
        parsed !== null &&
        'report' in parsed &&
        'projectKey' in parsed
        ? parsed
        : undefined;
    const resolvedProjectKey = args.project ?? merged.projectKey ?? existingPayload?.projectKey;
    if (!resolvedProjectKey) {
        console.error('Missing --project (or projectKey in ai-testing-tool.config.json / AI_TESTING_TOOL_PROJECT_KEY)');
        process.exit(1);
    }
    const report = existingPayload
        ? existingPayload.report
        : readJsonReport(reportPath);
    const payload = existingPayload
        ? {
            ...existingPayload,
            projectKey: resolvedProjectKey,
            launchName: args.launch ?? merged.launchName ?? existingPayload.launchName,
            planId: args.planId ?? merged.planId ?? existingPayload.planId,
            planKey: args.planKey ?? merged.planKey ?? existingPayload.planKey,
            planName: args.plan ?? merged.planName ?? existingPayload.planName,
            fixVersion: args.fixVersion ?? merged.fixVersion ?? existingPayload.fixVersion,
            sprintName: args.sprint ?? merged.sprintName ?? existingPayload.sprintName,
            ci: (0, forge_commons_1.detectCiEnvironment)(),
        }
        : (0, forge_commons_1.buildIngestPayload)({
            projectKey: resolvedProjectKey,
            report,
            format,
            launchName: args.launch ?? merged.launchName,
            planId: args.planId ?? merged.planId,
            planKey: args.planKey ?? merged.planKey,
            planName: args.plan ?? merged.planName,
            fixVersion: args.fixVersion ?? merged.fixVersion,
            sprintName: args.sprint ?? merged.sprintName,
            ci: (0, forge_commons_1.detectCiEnvironment)(),
        });
    const client = new forge_commons_1.IngestClient({
        url: args.url ?? merged.ingest?.url,
        token: args.token ?? merged.ingest?.token,
        timeoutMs: merged.ingest?.timeoutMs,
        completeTimeoutMs: merged.ingest?.completeTimeoutMs,
        maxPayloadBytes: merged.ingest?.maxPayloadBytes,
        chunkThresholdBytes: merged.ingest?.chunkThresholdBytes,
        chunkMaxBytes: merged.ingest?.chunkMaxBytes,
        maxRetries: merged.ingest?.maxRetries,
        retryBaseDelayMs: merged.ingest?.retryBaseDelayMs,
    });
    const response = await client.send(payload);
    console.log(JSON.stringify({ ok: true, status: response.status, body: response.body }));
}
main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
});
