# Mocha pilot — JSONPlaceholder + @qanalyzer/forge-mocha

API tests against [JSONPlaceholder](https://jsonplaceholder.typicode.com/) using **@qanalyzer/forge-mocha**.

## Setup

```bash
# from qanalyzer-js: build commons + @qanalyzer/forge-mocha first
cd ../../qa-javascript-commons && npm run build
cd ../qa-mocha && npm run build
cd ../examples/single/mocha && npm install
```

## Run

```bash
# no credentials (default)
npm test

# write the ingest payload file
npm run test:file

# ingest
QANALYZER_MODE=ingest \
QANALYZER_PROJECT_KEY=AUTH \
QANALYZER_INGEST_URL=... \
QANALYZER_INGEST_TOKEN=... \
npm test
```

## Specs

| File | Focus |
| ---- | ----- |
| `api-crud.spec.js` | User CRUD |
| `api-posts.spec.js` | Posts + filtering |
| `api-errors.spec.js` | 404 handling |
| `api-advanced.spec.js` | Nested steps, suite, ignore |

Jira keys live in titles (`AUTH-101` …). Helpers: `require('@qanalyzer/forge-mocha/mocha')`.
