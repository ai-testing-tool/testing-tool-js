import type { OptionsType } from '@ai-testing-tool/forge-commons';

import type { WdioSpecInput } from './report-builder';

/**
 * In-process collection of specs for publish from reporter and/or afterRunHook.
 */
export const ResultsBuffer = {
  options: {} as OptionsType,
  runStart: Date.now(),
  specs: [] as WdioSpecInput[],
  published: false,

  reset(options: OptionsType = {}): void {
    this.options = options;
    this.runStart = Date.now();
    this.specs = [];
    this.published = false;
  },

  setOptions(options: OptionsType): void {
    this.options = { ...this.options, ...options };
  },

  appendSpec(spec: WdioSpecInput): void {
    this.specs.push(spec);
  },

  /** Merge assertions into an existing file bucket or create one. */
  appendAssertion(
    file: string,
    assertion: WdioSpecInput['assertions'][number],
  ): void {
    let spec = this.specs.find((s) => s.name === file);
    if (!spec) {
      spec = {
        name: file,
        startTime: this.runStart,
        endTime: Date.now(),
        assertions: [],
      };
      this.specs.push(spec);
    }
    spec.assertions.push(assertion);
    spec.endTime = Date.now();
  },

  takeSpecs(): WdioSpecInput[] {
    const out = this.specs;
    this.specs = [];
    return out;
  },
};
