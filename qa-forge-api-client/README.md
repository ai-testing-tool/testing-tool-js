# @qanalyzer/forge-api-client

CLI client for the **QAnalyzer** Forge ingest API. Uploads Jest/Vitest JSON reports (Path A).

## Install

```bash
npm install -D @qanalyzer/forge-api-client
```

## Usage

```bash
npx jest --json --outputFile=qanalyzer-results.json
npx @qanalyzer/forge-api-client --project DEMO --report qanalyzer-results.json
```

## Options

| Flag | Description |
| ---- | ----------- |
| `--project`, `-p` | Jira project key |
| `--report`, `-r` | Path to the report (default `./qanalyzer-results.json`) |
| `--format` | `jest-json` (default) \| `vitest-json` \| `junit-xml` |
| `--url` | Forge ingest URL or gateway URL (or `QANALYZER_INGEST_URL`) |
| `--token` | Ingest bearer token (or `QANALYZER_INGEST_TOKEN`) |
| `--launch`, `-l` | Launch display name |
| `--plan` / `--plan-id` / `--plan-key` | Test plan name / UUID / slug |
| `--fix-version` / `--sprint` | Jira fix version / sprint tags |
| `--help`, `-h` | Show help |

Env vars mirror the reporters: `QANALYZER_PROJECT_KEY`, `QANALYZER_INGEST_URL`, `QANALYZER_INGEST_TOKEN`, `QANALYZER_LAUNCH_NAME`.

**Gateway mode:** also set `QANALYZER_FORGE_INGEST_URL` (Forge web trigger) when `QANALYZER_INGEST_URL` points at `qanalyzer/ingest-gateway`. Optional `QANALYZER_FORGE_INGEST_TOKEN` overrides the token embedded in the payload.
