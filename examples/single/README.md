# Single-project examples

Runnable pilots for each AI Testing Tool reporter. Structure mirrors [`qase-javascript/examples/single`](../../../qase/qase-javascript/examples/single) — same apps (Sauce Demo E2E / JSONPlaceholder API), adapted to `@ai-testing-tool/forge-*` helpers.

| Example | Runner | App under test |
| ------- | ------ | -------------- |
| [`jest`](./jest) | Jest | JSONPlaceholder API |
| [`mocha`](./mocha) | Mocha | JSONPlaceholder API |
| [`vitest`](./vitest) | Vitest | JSONPlaceholder API |
| [`playwright`](./playwright) | Playwright | saucedemo.com |
| [`cypress`](./cypress) | Cypress | saucedemo.com |
| [`wdio`](./wdio) | WebdriverIO | saucedemo.com |
| [`cucumberjs`](./cucumberjs) | CucumberJS | saucedemo.com |

## Common pattern

```bash
cd ai-testing-tool-js && npm run build
cd examples/single/<runner>
npm install
npm test   # AI_TESTING_TOOL_MODE=off by default
```

Prefer **`qa.issueKeys(['AUTH-101'])`** over embedding Jira keys in titles. Set `AI_TESTING_TOOL_MODE=ingest` with URL/token/project to upload launches.

Multi-project reporting (Qase `examples/multiProject`) is not supported by this SDK.
