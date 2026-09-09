# Mocha pilot — JSONPlaceholder + @ai-testing-tool/forge-mocha

API tests against [JSONPlaceholder](https://jsonplaceholder.typicode.com/) using **@ai-testing-tool/forge-mocha**.

## Setup

```bash
# from ai-testing-tool-js: build commons + @ai-testing-tool/forge-mocha first
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
AI_TESTING_TOOL_MODE=ingest \
AI_TESTING_TOOL_PROJECT_KEY=AUTH \
AI_TESTING_TOOL_INGEST_URL=... \
AI_TESTING_TOOL_INGEST_TOKEN=... \
npm test
```

## Specs

| File | Focus |
| ---- | ----- |
| `api-crud.spec.js` | User CRUD |
| `api-posts.spec.js` | Posts + filtering |
| `api-errors.spec.js` | 404 handling |
| `api-advanced.spec.js` | Nested steps, suite, ignore |

Jira keys live in titles (`AUTH-101` …). Helpers: `require('@ai-testing-tool/forge-mocha/mocha')`.
