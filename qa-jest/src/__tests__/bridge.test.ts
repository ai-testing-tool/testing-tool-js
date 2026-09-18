import { afterEach, beforeEach } from 'vitest';
import { qaDescribe, qaItAuto, expect } from '@qa/test';

import { clearQaJestBridge, getQaJestBridge, setQaJestBridge } from '../bridge.js';
import { JestQaReporter } from '../index.js';
import { drainQaMeta, qa, type QaJestBridge, type QaMetaEntry } from '../jest.js';

qaDescribe('qa jest bridge (jsdom-safe)', () => {
  beforeEach(() => {
    clearQaJestBridge();
  });

  afterEach(() => {
    clearQaJestBridge();
  });

  qaItAuto('helpers reach reporter buffer when only process has the bridge', async () => {
    const buffer: QaMetaEntry[] = [];
    const bridge: QaJestBridge = {
      push: (entry) => {
        buffer.push(entry);
      },
      drain: () => {
        const copy = [...buffer];
        buffer.length = 0;
        return copy;
      },
      currentTitle: 'Suite case',
    };
    setQaJestBridge(bridge);

    // Simulate jsdom: environment global lacks the bridge; process still has it.
    delete globalThis.__QA_JEST_BRIDGE__;
    expect(globalThis.__QA_JEST_BRIDGE__).toBeUndefined();
    expect(getQaJestBridge()).toBe(bridge);

    await qa.suite('Epic 1 / TC-7');
    await qa.step('open runs', async () => {
      expect(true).toBe(true);
    });

    expect(buffer.map((e) => e.type)).toEqual(['qa-suite', 'qa-step', 'qa-step-end']);
    expect(drainQaMeta().map((e) => e.type)).toEqual(['qa-suite', 'qa-step', 'qa-step-end']);
  });

  qaItAuto('reporter installBridge is visible via process after clearing globalThis', () => {
    // Constructor installs the bridge
    new JestQaReporter({}, { mode: 'off' });
    delete globalThis.__QA_JEST_BRIDGE__;
    expect(getQaJestBridge()).toBeDefined();
  });
});
