# @ai-testing-tool/forge-cucumberjs

CucumberJS formatter for **AI Testing Tool** (Jira Forge quality hub).

## Install

```bash
npm install -D @ai-testing-tool/forge-cucumberjs @ai-testing-tool/forge-commons @cucumber/cucumber
```

Peer: `@cucumber/cucumber` ≥10.

## Configure

```js
// cucumber.js
module.exports = {
  default: {
    format: ['progress', '@ai-testing-tool/forge-cucumberjs'],
    require: ['step_definitions/**/*.js'],
    // formatOptions: { mode: 'ingest', projectKey: 'DEMO' },
  },
};
```

### Modes

| Mode | Behavior |
| ---- | -------- |
| `off` (default) | No network / file write |
| `file` | Writes the ingest payload (default `./ai-testing-tool-results.json`) |
| `ingest` | POSTs the payload with `format: jest-json` |

Env: `AI_TESTING_TOOL_MODE`, `AI_TESTING_TOOL_PROJECT_KEY`, `AI_TESTING_TOOL_INGEST_URL`, `AI_TESTING_TOOL_INGEST_TOKEN`, `AI_TESTING_TOOL_LAUNCH_NAME`.

## Metadata (tags only)

No programmatic `qa` import — use Gherkin tags:

| Tag | Effect |
| --- | ------ |
| `@AUTH-101` | Issue key; also prefer keys in scenario titles |
| `@QaTitle=Custom_title` | Display title (underscores → spaces) |
| `@QaSuite=API\tUsers\tRead` | Suite hierarchy |
| `@QaFields={"layer":"api"}` | Custom fields JSON |
| `@QaParameters={"userId":"1"}` | Parameters JSON |
| `@QaIgnore` | Skip reporting |

Given/When/Then steps become `meta.qa.steps`. Use `function()` step defs for World (`this`).

## Dual path

```bash
# file
AI_TESTING_TOOL_MODE=file AI_TESTING_TOOL_PROJECT_KEY=DEMO npx cucumber-js

# ingest
AI_TESTING_TOOL_MODE=ingest AI_TESTING_TOOL_PROJECT_KEY=DEMO \
AI_TESTING_TOOL_INGEST_URL=... AI_TESTING_TOOL_INGEST_TOKEN=... \
npx cucumber-js
```
