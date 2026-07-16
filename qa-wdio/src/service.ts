/**
 * WDIO service for QAnalyzer (FR123).
 *
 * Register: `services: [[QaWdioService, { disableWebdriverScreenshotsReporting: false }]]`
 *
 * On test failure, captures a still-image screenshot (no video) and uploads via
 * Forge when configured (FR133). Cucumber: `afterScenario` (FR135). Never fails the WDIO run.
 */

import { uploadAttachmentForQa } from '@qanalyzer/forge-commons';

import { FailureScreenshotBuffer } from './failure-screenshot-buffer';

export type QaWdioServiceOptions = {
  /** When true (default), skip automatic failure screenshots. */
  disableWebdriverScreenshotsReporting?: boolean;
};

type AfterTestResult = {
  passed?: boolean;
  error?: Error;
};

type TestLike = {
  title?: string;
  fullTitle?: string | (() => string);
};

type ScenarioLike = {
  title?: string;
  name?: string;
  tags?: Array<{ name?: string } | string>;
};

type WorldLike = {
  passed?: boolean;
  error?: Error;
};

type BrowserLike = {
  takeScreenshot?: () => Promise<string>;
};

function resolveTitle(test: TestLike): string {
  if (typeof test.fullTitle === 'function') {
    try {
      return test.fullTitle() || test.title || 'unknown';
    } catch {
      // fall through
    }
  }
  if (typeof test.fullTitle === 'string' && test.fullTitle) {
    return test.fullTitle;
  }
  return test.title || 'unknown';
}

function scenarioTitle(scenario: ScenarioLike): string {
  return scenario.title || scenario.name || 'unknown';
}

function scenarioTagNames(scenario: ScenarioLike): string[] {
  if (!Array.isArray(scenario.tags)) return [];
  return scenario.tags
    .map((t) => (typeof t === 'string' ? t : t?.name || ''))
    .filter(Boolean);
}

function browserRef(): BrowserLike | undefined {
  const g = globalThis as { browser?: BrowserLike };
  return g.browser;
}

async function captureFailureScreenshot(
  label: string,
  issueKeySources: Array<string | undefined>,
): Promise<void> {
  const browser = browserRef();
  if (!browser?.takeScreenshot) return;

  const b64 = await browser.takeScreenshot();
  if (!b64) return;

  const content = Buffer.from(b64, 'base64');
  const outcome = await uploadAttachmentForQa({
    fileName: 'screenshot.png',
    mimeType: 'image/png',
    content,
    issueKeySources,
  });
  FailureScreenshotBuffer.add(label, outcome.attachment);
}

export class QaWdioService {
  private readonly disableScreenshots: boolean;

  constructor(options: QaWdioServiceOptions = {}) {
    this.disableScreenshots =
      options.disableWebdriverScreenshotsReporting ?? true;
  }

  before(): void {
    FailureScreenshotBuffer.clear();
  }

  beforeTest(): void {
    // no-op
  }

  async afterTest(
    test: TestLike,
    _context: unknown,
    result: AfterTestResult,
  ): Promise<void> {
    if (this.disableScreenshots) return;
    if (result?.passed) return;

    const title = resolveTitle(test);
    try {
      await captureFailureScreenshot(test.title || title, [title, test.title]);
    } catch {
      // Never fail the WDIO run
    }
  }

  /**
   * Cucumber / Gherkin failure still-image (FR135 + FR133).
   * WDIO cucumber framework invokes this after each scenario.
   */
  async afterScenario(
    world: WorldLike,
    result: { passed?: boolean; error?: Error } | undefined,
    scenario: ScenarioLike,
  ): Promise<void> {
    if (this.disableScreenshots) return;
    const passed = result?.passed ?? world?.passed;
    if (passed) return;

    const title = scenarioTitle(scenario);
    const tags = scenarioTagNames(scenario);
    try {
      await captureFailureScreenshot(title, [title, ...tags]);
    } catch {
      // Never fail the WDIO run
    }
  }

  after(): void {
    // no-op
  }
}
