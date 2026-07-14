"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResultsBuffer = void 0;
/**
 * In-process collection of specs for publish from reporter and/or afterRunHook.
 */
exports.ResultsBuffer = {
    options: {},
    runStart: Date.now(),
    specs: [],
    published: false,
    reset(options = {}) {
        this.options = options;
        this.runStart = Date.now();
        this.specs = [];
        this.published = false;
    },
    setOptions(options) {
        this.options = { ...this.options, ...options };
    },
    appendSpec(spec) {
        this.specs.push(spec);
    },
    /** Merge assertions into an existing file bucket or create one. */
    appendAssertion(file, assertion) {
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
    takeSpecs() {
        const out = this.specs;
        this.specs = [];
        return out;
    },
};
