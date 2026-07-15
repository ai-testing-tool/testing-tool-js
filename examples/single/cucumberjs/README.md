# CucumberJS pilot — JSONPlaceholder + qa-forge-cucumberjs

BDD features against [JSONPlaceholder](https://jsonplaceholder.typicode.com/) using **qa-forge-cucumberjs**.

## Setup

```bash
cd ../../qa-javascript-commons && npm run build
cd ../qa-cucumberjs && npm run build
cd ../examples/single/cucumberjs && npm install
```

## Run

```bash
npm test

npm run test:file

QANALYZER_MODE=ingest \
QANALYZER_PROJECT_KEY=AUTH \
QANALYZER_INGEST_URL=... \
QANALYZER_INGEST_TOKEN=... \
npm test
```

## Metadata (tags — no programmatic `qa` import)

| Tag | Meaning |
| --- | ------- |
| `@AUTH-101` | Jira issue key (also put keys in Scenario titles) |
| `@QaTitle=...` | Display title |
| `@QaSuite=API\tUsers\tRead` | Suite hierarchy |
| `@QaFields={...}` | Fields JSON |
| `@QaParameters={...}` | Parameters JSON |
| `@QaIgnore` | Skip reporting |

Use `function()` step definitions so World `this` works. Attachments via `this.attach()` are deferred (binary upload is not yet supported).

## Features

| File | Focus |
| ---- | ----- |
| `api-crud.feature` | User CRUD |
| `api-posts.feature` | Posts + Scenario Outline |
| `api-errors.feature` | Error handling |
| `api-advanced.feature` | Nested suites, parameters, ignore |
