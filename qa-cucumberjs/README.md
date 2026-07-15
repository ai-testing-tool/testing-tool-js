# qa-cucumberjs

CucumberJS formatter for **QAnalyzer** (Jira Forge quality hub).

## Install

```bash
npm install -D qa-cucumberjs qa-javascript-commons @cucumber/cucumber
```

Peer: `@cucumber/cucumber` ≥10.

## Configure

```js
// cucumber.js
module.exports = {
  default: {
    format: ['progress', 'qa-cucumberjs'],
    require: ['step_definitions/**/*.js'],
    // formatOptions: { mode: 'ingest', projectKey: 'DEMO' },
  },
};
```

### Modes

| Mode | Behavior |
| ---- | -------- |
| `off` (default) | No network / file write |
| `file` | Writes the ingest payload (default `./qanalyzer-results.json`) |
| `ingest` | POSTs the payload with `format: jest-json` |

Env: `QANALYZER_MODE`, `QANALYZER_PROJECT_KEY`, `QANALYZER_INGEST_URL`, `QANALYZER_INGEST_TOKEN`, `QANALYZER_LAUNCH_NAME`.

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
QANALYZER_MODE=file QANALYZER_PROJECT_KEY=DEMO npx cucumber-js

# ingest
QANALYZER_MODE=ingest QANALYZER_PROJECT_KEY=DEMO \
QANALYZER_INGEST_URL=... QANALYZER_INGEST_TOKEN=... \
npx cucumber-js
```
