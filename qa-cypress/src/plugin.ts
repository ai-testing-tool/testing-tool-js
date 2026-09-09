/**
 * Cypress Node plugin — register in cypress.config.js setupNodeEvents:
 *   require('@ai-testing-tool/forge-cypress/plugin')(on, config);
 *
 * before:run clears the results bridge; after:run publishes FR41
 * (mode=ingest | file) via @ai-testing-tool/forge-commons.
 * after:screenshot captures failure still images for Phase 3 upload (FR71).
 */

import {
  ModeEnum,
  AiTestingToolReporter,
  type OptionsType,
} from '@ai-testing-tool/forge-commons';

import { enrichSpecsWithFailureScreenshots } from './enrich-screenshots';
import { toJestJsonReport } from './report-builder';
import { resolveQaOptions } from './resolve-options';
import { ResultsManager } from './results-manager';
import { ScreenshotsManager } from './screenshots-manager';

type PluginOn = {
  (event: string, handler: (...args: unknown[]) => unknown): void;
};

type PluginConfig = Record<string, unknown> & {
  projectRoot?: string;
  reporterOptions?: Record<string, unknown> | null;
};

type ScreenshotDetails = {
  path?: string;
  name?: string;
  specName?: string;
  testFailure?: boolean;
  takenAt?: string;
};

async function publishCollected(
  options: OptionsType & { resultsPath?: string },
): Promise<void> {
  const path = ResultsManager.resolvePath(options.resultsPath);
  const specs = ResultsManager.getSpecs(path);
  if (specs.length === 0) {
    ScreenshotsManager.clear();
    return;
  }

  AiTestingToolReporter.resetInstance();
  const reporter = AiTestingToolReporter.getInstance({
    ...options,
    mode: options.mode ?? ModeEnum.off,
  });

  const mode = reporter.getConfig().mode ?? ModeEnum.off;
  if (mode === ModeEnum.off) {
    ResultsManager.clear(path);
    ScreenshotsManager.clear();
    return;
  }

  try {
    await enrichSpecsWithFailureScreenshots(specs);
  } catch {
    // Never fail the Cypress run because of attach errors
  }

  const report = toJestJsonReport(specs, Date.now());
  await reporter.publishReport(report, {
    format: 'jest-json',
    launchName: options.launchName,
    projectKey: options.projectKey,
  });
  ResultsManager.clear(path);
  ScreenshotsManager.clear();
}

function plugin(on: PluginOn, config: PluginConfig): PluginConfig {
  const qaOptions = resolveQaOptions(config.reporterOptions);
  if (qaOptions.resultsPath) {
    process.env.AI_TESTING_TOOL_CYPRESS_RESULTS_PATH = qaOptions.resultsPath;
  } else if (config.projectRoot && !process.env.AI_TESTING_TOOL_CYPRESS_RESULTS_PATH) {
    process.env.AI_TESTING_TOOL_CYPRESS_RESULTS_PATH = `${config.projectRoot}/.qa-cypress-results.json`;
  }

  on('before:run', () => {
    ResultsManager.clear(ResultsManager.resolvePath(qaOptions.resultsPath));
    ScreenshotsManager.clear();
  });

  on('after:screenshot', (details: unknown) => {
    try {
      const d = details as ScreenshotDetails;
      if (!d?.path) return details;
      ScreenshotsManager.append({
        path: d.path,
        name: d.name,
        specName: d.specName,
        testFailure: d.testFailure,
        takenAt: d.takenAt,
      });
    } catch {
      // Never fail the Cypress run
    }
    return details;
  });

  on('after:run', async () => {
    try {
      await publishCollected(resolveQaOptions(config.reporterOptions));
    } catch {
      // Never fail the Cypress run because of publish errors
    }
  });

  return config;
}

export = plugin;
