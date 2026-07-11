# qanalyzer-js

JavaScript / TypeScript client SDK for **QAnalyzer** (Jira Forge quality hub).

| Package | npm name | Status |
| ------- | -------- | ------ |
| Commons | `qa-javascript-commons` | Scaffold |
| Forge API client | `qa-forge-api-client` | Scaffold |
| Vitest reporter | `qa-vitest` | Scaffold (Sprint 4 / Epic 2.1) |
| Jest reporter | `qa-jest` | Scaffold (Sprint 5 / Epic 2.2) |
| Cypress | `qa-cypress` | Planned (P3) |

**Location:** `bmad-crm/qanalyzer/qanalyzer-js` (product workspace; own npm publish pipeline).

**Contract:** Forge ingest [FR41](../docs/architecture.md#ingestion-contract-fr41) — schema in [`schemas/ingest-payload.schema.json`](./schemas/ingest-payload.schema.json).

**Design:** [npm-commons-proposal.md](../docs/architecture/npm-commons-proposal.md).

## Quick start (after P0)

```bash
cd qanalyzer/qanalyzer-js
npm install
npm run build

# From a customer CI job:
npx qa-forge-api-client --project AUTH --report qanalyzer-results.json
```

Env: `QANALYZER_INGEST_URL`, `QANALYZER_INGEST_TOKEN`.

## Layout

```
qanalyzer-js/
├── qa-javascript-commons/
├── qa-forge-api-client/
├── qa-vitest/
├── qa-jest/
├── schemas/ingest-payload.schema.json
└── package.json          # npm workspaces root
```

Sibling: `../qanalyzer-app` (Forge) · `../docs` (PRD / architecture).

## Publish hygiene

This tree is the **customer-facing npm surface**. Keep it product-only.

| Do | Don't |
| -- | ----- |
| Describe QAnalyzer / Forge / Jira contracts | Name competitors or third-party TMS products in source, JSDoc, READMEs, or examples |
| Put competitive / reference notes in `../docs/` only | Link external competitor repos from this tree |
| Ship neutral domain terms (result, launch, step, ingest) | Copy competitor type names or “mirrors X” comments into published `.d.ts` |

### Pre-publish checklist

1. `npm run build` (and package tests) succeed.
2. No competitor leakage:

   ```bash
   # from qanalyzer-js/ — must print nothing
   grep -riE 'qase|testops' --exclude-dir=node_modules --exclude='package-lock.json' .
   ```

3. Package `files` / `exports` include only intended artifacts (`dist`, schema as needed).
4. READMEs and examples mention only QAnalyzer env vars, CLI, and Forge configure flow.
5. Confirm version bump + changelog before `npm publish`.
