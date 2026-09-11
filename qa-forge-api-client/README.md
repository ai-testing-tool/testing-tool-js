# @ai-testing-tool/forge-api-client

CLI client for the **AI Testing Tool** Forge ingest API. Uploads Jest/Vitest JSON reports (Path A).

## Install

```bash
npm install -D @ai-testing-tool/forge-api-client
```

## Usage

```bash
npx jest --json --outputFile=ai-testing-tool-results.json
npx @ai-testing-tool/forge-api-client --project DEMO --report ai-testing-tool-results.json
```

## Options

| Flag | Description |
| ---- | ----------- |
| `--project`, `-p` | Jira project key |
| `--report`, `-r` | Path to the report (default `./ai-testing-tool-results.json`) |
| `--format` | `jest-json` (default) \| `vitest-json` \| `normalized` |
| `--url` | Forge web-trigger ingest URL (or `AI_TESTING_TOOL_INGEST_URL`) |
| `--token` | Ingest bearer token (or `AI_TESTING_TOOL_INGEST_TOKEN`) |
| `--launch`, `-l` | Launch display name |
| `--plan` / `--plan-id` / `--plan-key` | Test plan name / UUID / slug |
| `--fix-version` / `--sprint` | Jira fix version / sprint tags |
| `--help`, `-h` | Show help |

Env vars mirror the reporters: `AI_TESTING_TOOL_PROJECT_KEY`, `AI_TESTING_TOOL_INGEST_URL`, `AI_TESTING_TOOL_INGEST_TOKEN`, `AI_TESTING_TOOL_LAUNCH_NAME`.

## Upload progress

While uploading (especially large/chunked reports), the CLI prints percent progress to **stderr**, e.g.:

```text
Ingest upload: 33% — Chunk 1/2 accepted
Ingest upload: 100% — Upload finished
```

Stdout stays a single JSON line (`{ "ok": true, "status": 201, ... }`) for scripting.
