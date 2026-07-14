"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CypressQaReporter = void 0;
const mocha_1 = require("mocha");
const qa_javascript_commons_1 = require("qa-javascript-commons");
const metadata_manager_1 = require("./metadata-manager");
const results_manager_1 = require("./results-manager");
function mapStatus(state) {
    if (state === 'failed')
        return 'failed';
    if (state === 'pending')
        return 'pending';
    return 'passed';
}
function ancestorTitles(test) {
    try {
        const path = typeof test.titlePath === 'function' ? test.titlePath() : [];
        if (path.length > 1)
            return path.slice(0, -1);
    }
    catch {
        // fall through
    }
    const titles = [];
    let parent = test.parent;
    while (parent && !parent.root) {
        if (parent.title)
            titles.unshift(parent.title);
        parent = parent.parent;
    }
    return titles;
}
function specFileName(test) {
    const fromTest = test.file;
    if (fromTest)
        return fromTest;
    let parent = test.parent;
    while (parent) {
        const file = parent.file;
        if (file)
            return file;
        parent = parent.parent;
    }
    return 'unknown';
}
function failureMessages(test) {
    const err = test.err;
    if (!err)
        return [];
    const msg = err.stack || err.message;
    return msg ? [msg] : [];
}
/**
 * Cypress Mocha reporter for QAnalyzer.
 *
 * Collects per-`it()` results + `qa.*` metadata, appends to ResultsManager.
 * Plugin `after:run` publishes FR41 (mode=ingest|file). mode=off no-ops.
 */
class CypressQaReporter extends mocha_1.reporters.Base {
    options;
    byFile = new Map();
    runStart = Date.now();
    constructor(runner, options = {}) {
        super(runner, options);
        this.options = options.reporterOptions ?? {};
        if (this.options.resultsPath) {
            process.env.QANALYZER_CYPRESS_RESULTS_PATH = this.options.resultsPath;
        }
        runner.on(mocha_1.Runner.constants.EVENT_TEST_BEGIN, () => {
            metadata_manager_1.MetadataManager.clear();
        });
        runner.on(mocha_1.Runner.constants.EVENT_TEST_PASS, (test) => {
            this.record(test, 'passed');
        });
        runner.on(mocha_1.Runner.constants.EVENT_TEST_FAIL, (test) => {
            this.record(test, 'failed');
        });
        runner.on(mocha_1.Runner.constants.EVENT_TEST_PENDING, (test) => {
            this.record(test, 'pending');
        });
        runner.once(mocha_1.Runner.constants.EVENT_RUN_END, () => {
            this.flushToResultsManager();
        });
    }
    record(test, state) {
        try {
            const entries = metadata_manager_1.MetadataManager.getEntries();
            const wire = (0, qa_javascript_commons_1.qaMetaFromEntries)(entries, {
                framework: 'cypress',
                reporter: 'qa-cypress',
            });
            metadata_manager_1.MetadataManager.clear();
            const ancestors = ancestorTitles(test);
            const assertion = {
                ancestorTitles: ancestors,
                title: test.title,
                fullName: ancestors.length > 0 ? `${ancestors.join(' ')} ${test.title}` : test.title,
                status: mapStatus(state ?? test.state),
                duration: test.duration ?? undefined,
                failureMessages: state === 'failed' ? failureMessages(test) : [],
            };
            if (wire) {
                assertion.meta = { qa: wire };
            }
            const file = specFileName(test);
            const list = this.byFile.get(file) ?? [];
            list.push(assertion);
            this.byFile.set(file, list);
        }
        catch {
            // Never fail the Cypress run
        }
    }
    flushToResultsManager() {
        try {
            const mode = this.options.mode ?? qa_javascript_commons_1.ModeEnum.off;
            // Always buffer when not off so after:run can publish; also buffer when
            // off so local debugging of the bridge still works without publish.
            const path = results_manager_1.ResultsManager.resolvePath(this.options.resultsPath);
            for (const [name, assertions] of this.byFile) {
                if (assertions.length === 0)
                    continue;
                const spec = {
                    name,
                    startTime: this.runStart,
                    endTime: Date.now(),
                    assertions,
                };
                results_manager_1.ResultsManager.appendSpec(spec, path);
            }
            this.byFile.clear();
            // Hint for logs / tests — actual publish is plugin after:run
            void mode;
        }
        catch {
            // Never fail the Cypress run
        }
    }
}
exports.CypressQaReporter = CypressQaReporter;
exports.default = CypressQaReporter;
