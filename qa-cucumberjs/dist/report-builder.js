"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadScenarioAttachments = uploadScenarioAttachments;
exports.scenarioToAssertion = scenarioToAssertion;
exports.scenarioToAssertionAsync = scenarioToAssertionAsync;
exports.toJestJsonReport = toJestJsonReport;
exports.specsFromAssertions = specsFromAssertions;
const qa_forge_commons_1 = require("qa-forge-commons");
const tag_parser_1 = require("./modules/tag-parser");
function mapStepStatus(status) {
    if (status === 'FAILED' || status === 'AMBIGUOUS')
        return 'failed';
    if (status === 'PASSED')
        return 'passed';
    return 'skipped';
}
function decodeAttachmentBody(body, contentEncoding) {
    const encoding = contentEncoding.toUpperCase();
    if (encoding === 'BASE64') {
        return Buffer.from(body, 'base64');
    }
    return Buffer.from(body, 'utf8');
}
function defaultFileName(att, index) {
    if (att.fileName)
        return att.fileName;
    const subtype = att.mediaType.split('/')[1];
    if (subtype && /^[a-z0-9.+-]+$/i.test(subtype)) {
        return `attachment-${index + 1}.${subtype}`;
    }
    return `attachment-${index + 1}.bin`;
}
/**
 * Upload Cucumber attachments (FR58). Never throws — missing key / oversize /
 * config → metadata-only wire entries.
 */
async function uploadScenarioAttachments(scenario, title, tagIssueKeys) {
    const entries = [];
    const issueKeySources = [
        ...tagIssueKeys,
        title,
        scenario.title,
        scenario.pickle.name,
        ...(scenario.pickle.tags ?? []).map((t) => t.name),
    ];
    for (let i = 0; i < scenario.attachments.length; i += 1) {
        const att = scenario.attachments[i];
        try {
            const content = decodeAttachmentBody(att.body, att.contentEncoding);
            const fileName = defaultFileName(att, i);
            const outcome = await (0, qa_forge_commons_1.uploadAttachmentForQa)({
                fileName,
                mimeType: att.mediaType,
                content,
                issueKey: tagIssueKeys[0],
                issueKeySources,
            });
            entries.push({
                type: 'qa-attach',
                body: {
                    name: outcome.attachment.file_name ?? fileName,
                    contentType: outcome.attachment.mime_type ?? att.mediaType,
                    size: outcome.attachment.size,
                    content_ref: outcome.attachment.content_ref,
                },
            });
        }
        catch {
            entries.push({
                type: 'qa-attach',
                body: {
                    name: defaultFileName(att, i),
                    contentType: att.mediaType,
                },
            });
        }
    }
    return entries;
}
/**
 * Convert a finished Cucumber scenario into one FR41 assertion (or null if @QaIgnore).
 * Pass pre-built attachEntries from {@link uploadScenarioAttachments} when available.
 */
function scenarioToAssertion(scenario, attachEntries = []) {
    const tagMeta = (0, tag_parser_1.parseQaTags)(scenario.pickle.tags ?? []);
    if (tagMeta.ignore)
        return null;
    const title = (0, tag_parser_1.resolveScenarioTitle)(scenario.title, tagMeta);
    const ancestors = tagMeta.suite && tagMeta.suite.length > 0
        ? tagMeta.suite.split('\t').map((s) => s.trim()).filter(Boolean)
        : [scenario.featureName];
    const entries = [];
    if (tagMeta.suite) {
        entries.push({ type: 'qa-suite', body: tagMeta.suite });
    }
    if (Object.keys(tagMeta.fields).length > 0) {
        entries.push({ type: 'qa-fields', body: tagMeta.fields });
    }
    if (Object.keys(tagMeta.parameters).length > 0) {
        entries.push({ type: 'qa-parameters', body: tagMeta.parameters });
    }
    if (tagMeta.title) {
        entries.push({ type: 'qa-title', body: tagMeta.title });
    }
    for (const step of scenario.steps) {
        entries.push({ type: 'qa-step', body: step.text });
        const stepStatus = mapStepStatus(step.status);
        if (stepStatus === 'failed') {
            entries.push({
                type: 'qa-step-failed',
                body: { name: step.text, status: 'failed' },
            });
        }
        else {
            entries.push({
                type: 'qa-step-end',
                body: { name: step.text, status: stepStatus },
            });
        }
    }
    entries.push(...attachEntries);
    const wire = (0, qa_forge_commons_1.qaMetaFromEntries)(entries, {
        framework: 'cucumberjs',
        reporter: 'qa-forge-cucumberjs',
    });
    const assertion = {
        ancestorTitles: ancestors,
        title,
        fullName: ancestors.length > 0 ? `${ancestors.join(' ')} ${title}` : title,
        status: scenario.status,
        duration: scenario.durationMs,
        failureMessages: scenario.failureMessages,
    };
    if (wire) {
        assertion.meta = { qa: wire };
    }
    return assertion;
}
/**
 * Build assertion including Phase 3 attachment upload (FR58).
 */
async function scenarioToAssertionAsync(scenario) {
    const tagMeta = (0, tag_parser_1.parseQaTags)(scenario.pickle.tags ?? []);
    if (tagMeta.ignore)
        return null;
    const title = (0, tag_parser_1.resolveScenarioTitle)(scenario.title, tagMeta);
    const attachEntries = await uploadScenarioAttachments(scenario, title, tagMeta.issueKeys);
    return scenarioToAssertion(scenario, attachEntries);
}
function mapAssertion(a) {
    const assertion = {
        ancestorTitles: a.ancestorTitles,
        fullName: a.fullName ??
            (a.ancestorTitles.length > 0
                ? `${a.ancestorTitles.join(' ')} ${a.title}`
                : a.title),
        title: a.title,
        status: a.status,
        duration: a.duration,
        failureMessages: a.failureMessages ?? [],
    };
    if (a.meta?.qa) {
        assertion.meta = { qa: a.meta.qa };
    }
    return assertion;
}
function fileStatus(assertions) {
    return assertions.some((a) => a.status === 'failed') ? 'failed' : 'passed';
}
/**
 * Normalize Cucumber scenarios into FR41 jest-json shape A (FR50).
 */
function toJestJsonReport(specs, startTime) {
    const testResults = specs.map((spec) => {
        const assertionResults = spec.assertions.map(mapAssertion);
        return {
            name: spec.name,
            status: fileStatus(assertionResults),
            startTime: spec.startTime,
            endTime: spec.endTime,
            assertionResults,
        };
    });
    let numPassedTests = 0;
    let numFailedTests = 0;
    let numPendingTests = 0;
    let numTodoTests = 0;
    for (const file of testResults) {
        for (const a of file.assertionResults ?? []) {
            if (a.status === 'passed')
                numPassedTests += 1;
            else if (a.status === 'failed')
                numFailedTests += 1;
            else if (a.status === 'todo')
                numTodoTests += 1;
            else
                numPendingTests += 1;
        }
    }
    const numTotalTests = numPassedTests + numFailedTests + numPendingTests + numTodoTests;
    const numFailedTestSuites = testResults.filter((t) => t.status === 'failed')
        .length;
    const numPassedTestSuites = testResults.length - numFailedTestSuites;
    return {
        numTotalTestSuites: testResults.length,
        numPassedTestSuites,
        numFailedTestSuites,
        numPendingTestSuites: 0,
        numTotalTests,
        numPassedTests,
        numFailedTests,
        numPendingTests,
        numTodoTests,
        startTime,
        success: numFailedTests === 0,
        testResults,
    };
}
/** Group assertions by feature URI. */
function specsFromAssertions(assertionsByUri, runStart, runEnd) {
    const specs = [];
    for (const [name, assertions] of assertionsByUri) {
        if (assertions.length === 0)
            continue;
        specs.push({
            name,
            startTime: runStart,
            endTime: runEnd,
            assertions,
        });
    }
    return specs;
}
