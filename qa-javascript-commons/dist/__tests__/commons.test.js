"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const compose_options_1 = require("../options/compose-options");
const ingest_payload_1 = require("../models/ingest-payload");
const env_to_config_1 = require("../env/env-to-config");
const options_resolver_1 = require("../qanalyzer/options-resolver");
(0, node_test_1.describe)('composeOptions', () => {
    (0, node_test_1.it)('skips undefined values from later sources', () => {
        const merged = (0, compose_options_1.composeOptions)({ mode: 'off', projectKey: 'AUTH' }, { launchName: 'ci #1' });
        strict_1.default.equal(merged.mode, 'off');
        strict_1.default.equal(merged.projectKey, 'AUTH');
        strict_1.default.equal(merged.launchName, 'ci #1');
    });
});
(0, node_test_1.describe)('buildIngestPayload', () => {
    (0, node_test_1.it)('wraps Jest JSON with FR41 metadata', () => {
        const payload = (0, ingest_payload_1.buildIngestPayload)({
            projectKey: 'AUTH',
            launchName: 'local',
            report: {
                numTotalTests: 1,
                testResults: [{ name: 'suite.test.ts', assertionResults: [] }],
            },
            ci: { ciPlatform: 'github', buildUrl: 'https://example/run/1' },
        });
        strict_1.default.equal(payload.projectKey, 'AUTH');
        strict_1.default.equal(payload.launchName, 'local');
        strict_1.default.equal(payload.ciPlatform, 'github');
        strict_1.default.deepEqual(payload.report.testResults, [
            { name: 'suite.test.ts', assertionResults: [] },
        ]);
    });
    (0, node_test_1.it)('includes optional fixVersion and sprintName (FR21)', () => {
        const payload = (0, ingest_payload_1.buildIngestPayload)({
            projectKey: 'AUTH',
            report: { numTotalTests: 0, testResults: [] },
            fixVersion: ' 2.4.0 ',
            sprintName: 'Sprint 42',
        });
        strict_1.default.equal(payload.fixVersion, '2.4.0');
        strict_1.default.equal(payload.sprintName, 'Sprint 42');
    });
    (0, node_test_1.it)('builds junit-xml payload with XML string report (FR45)', () => {
        const xml = '<testsuite name="T"><testcase name="a" classname="c"/></testsuite>';
        const payload = (0, ingest_payload_1.buildIngestPayload)({
            projectKey: 'AUTH',
            format: 'junit-xml',
            report: xml,
        });
        strict_1.default.equal(payload.format, 'junit-xml');
        strict_1.default.equal(payload.report, xml);
    });
});
(0, node_test_1.describe)('envToConfig version tags', () => {
    (0, node_test_1.it)('maps QANALYZER_FIX_VERSION and QANALYZER_SPRINT', () => {
        const prevFix = process.env.QANALYZER_FIX_VERSION;
        const prevSprint = process.env.QANALYZER_SPRINT;
        process.env.QANALYZER_FIX_VERSION = '2.4.0';
        process.env.QANALYZER_SPRINT = 'Sprint 42';
        try {
            const config = (0, env_to_config_1.envToConfig)();
            strict_1.default.equal(config.fixVersion, '2.4.0');
            strict_1.default.equal(config.sprintName, 'Sprint 42');
        }
        finally {
            if (prevFix === undefined)
                delete process.env.QANALYZER_FIX_VERSION;
            else
                process.env.QANALYZER_FIX_VERSION = prevFix;
            if (prevSprint === undefined)
                delete process.env.QANALYZER_SPRINT;
            else
                process.env.QANALYZER_SPRINT = prevSprint;
        }
    });
});
(0, node_test_1.describe)('createDefaultConfig', () => {
    (0, node_test_1.it)('defaults to mode off with ingest limits', () => {
        const config = (0, options_resolver_1.createDefaultConfig)();
        strict_1.default.equal(config.mode, 'off');
        strict_1.default.equal(config.ingest?.maxPayloadBytes, 4_500_000);
    });
    (0, node_test_1.it)('merges env overrides last', () => {
        const previous = process.env.QANALYZER_PROJECT_KEY;
        process.env.QANALYZER_PROJECT_KEY = 'DEMO';
        try {
            const merged = (0, compose_options_1.composeOptions)((0, options_resolver_1.createDefaultConfig)(), (0, env_to_config_1.envToConfig)());
            strict_1.default.equal(merged.projectKey, 'DEMO');
        }
        finally {
            if (previous === undefined) {
                delete process.env.QANALYZER_PROJECT_KEY;
            }
            else {
                process.env.QANALYZER_PROJECT_KEY = previous;
            }
        }
    });
});
