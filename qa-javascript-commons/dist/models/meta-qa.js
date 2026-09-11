"use strict";
/**
 * FR41 wire shape for `assertionResults[].meta.qa`
 * (architecture ingest contract — simplified TestResultType serialization).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createQaMetaAccumulator = createQaMetaAccumulator;
exports.applyQaAnnotation = applyQaAnnotation;
exports.applyQaAnnotations = applyQaAnnotations;
exports.resolveHostEnvironment = resolveHostEnvironment;
exports.resetHostEnvironmentCache = resetHostEnvironmentCache;
exports.toQaMetaWire = toQaMetaWire;
exports.qaMetaFromEntries = qaMetaFromEntries;
const ci_environment_1 = require("../env/ci-environment");
function createQaMetaAccumulator() {
    return { labels: [], issueKeys: [], steps: [], attachments: [] };
}
const ISSUE_KEY_BODY_RE = /^[A-Z][A-Z0-9]+-\d+$/i;
/** Split string or string[] on commas/whitespace; trim; drop empties. */
function splitCommaParts(raw) {
    const parts = [];
    if (typeof raw === 'string') {
        parts.push(...raw
            .split(/[\s,]+/)
            .map((s) => s.trim())
            .filter(Boolean));
    }
    else if (Array.isArray(raw)) {
        for (const item of raw) {
            if (typeof item === 'string' && item.trim())
                parts.push(item.trim());
        }
    }
    return parts;
}
/** Normalize and append unique issue keys (preserve first-seen order). */
function appendIssueKeys(acc, raw) {
    for (const part of splitCommaParts(raw)) {
        const key = part.toUpperCase();
        if (!ISSUE_KEY_BODY_RE.test(key))
            continue;
        if (acc.issueKeys.includes(key))
            continue;
        acc.issueKeys.push(key);
    }
}
/** Normalize and append unique labels (preserve first-seen order; case-sensitive). */
function appendLabels(acc, raw) {
    for (const part of splitCommaParts(raw)) {
        if (acc.labels.includes(part))
            continue;
        acc.labels.push(part);
    }
}
function asNonEmptyString(value) {
    if (typeof value !== 'string')
        return undefined;
    const trimmed = value.trim();
    return trimmed || undefined;
}
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function asStringRecord(value) {
    if (!isRecord(value))
        return undefined;
    const out = {};
    for (const [k, v] of Object.entries(value)) {
        if (v != null)
            out[String(k)] = String(v);
    }
    return out;
}
function resolveType(ann) {
    if (ann.type?.startsWith('qa-')) {
        return ann.type;
    }
    const message = ann.message ?? '';
    if (message.startsWith('QA Title:'))
        return 'qa-title';
    if (message.startsWith('QA Comment:'))
        return 'qa-comment';
    if (message.startsWith('QA SuiteId:'))
        return 'qa-suite-id';
    if (message.startsWith('QA Suite:'))
        return 'qa-suite';
    if (message.startsWith('QA PlanId:'))
        return 'qa-plan-id';
    if (message.startsWith('QA Plan:'))
        return 'qa-plan';
    if (message.startsWith('QA FixVersion:'))
        return 'qa-fix-version';
    if (message.startsWith('QA SprintName:'))
        return 'qa-sprint-name';
    if (message.startsWith('QA Labels:'))
        return 'qa-labels';
    if (message.startsWith('QA Fields:'))
        return 'qa-fields';
    if (message.startsWith('QA Parameters:'))
        return 'qa-parameters';
    if (message.startsWith('QA IssueKeys:'))
        return 'qa-issue-keys';
    if (message.startsWith('QA IssueKey:'))
        return 'qa-issue-key';
    if (message.startsWith('QA Step Failed:'))
        return 'qa-step-failed';
    if (message.startsWith('QA Step End:'))
        return 'qa-step-end';
    if (message.startsWith('QA Step Start:'))
        return 'qa-step-start';
    if (message.startsWith('QA Step:'))
        return 'qa-step';
    if (message.startsWith('QA Attach:'))
        return 'qa-attach';
    if (message.startsWith('QA Ignore'))
        return 'qa-ignore';
    return undefined;
}
function stripPrefix(message, prefix) {
    return message.startsWith(prefix) ? message.slice(prefix.length).trim() : message.trim();
}
/**
 * Apply a Vitest/Jest QA annotation (or typed helper entry) onto an accumulator.
 * Non-QA annotations are ignored.
 */
function applyQaAnnotation(acc, ann) {
    const type = resolveType(ann);
    if (!type)
        return;
    const message = ann.message ?? '';
    switch (type) {
        case 'qa-title':
            acc.title =
                typeof ann.body === 'string' ? ann.body : stripPrefix(message, 'QA Title:');
            break;
        case 'qa-comment':
            acc.comment =
                typeof ann.body === 'string' ? ann.body : stripPrefix(message, 'QA Comment:');
            break;
        case 'qa-suite':
            acc.suite =
                typeof ann.body === 'string' ? ann.body : stripPrefix(message, 'QA Suite:');
            break;
        case 'qa-suite-id': {
            const value = asNonEmptyString(ann.body) ??
                asNonEmptyString(stripPrefix(message, 'QA SuiteId:'));
            if (value)
                acc.suiteId = value;
            break;
        }
        case 'qa-plan-id': {
            const value = asNonEmptyString(ann.body) ??
                asNonEmptyString(stripPrefix(message, 'QA PlanId:'));
            if (value)
                acc.planId = value;
            break;
        }
        case 'qa-plan': {
            const value = asNonEmptyString(ann.body) ??
                asNonEmptyString(stripPrefix(message, 'QA Plan:'));
            if (value)
                acc.planName = value;
            break;
        }
        case 'qa-fix-version': {
            const value = asNonEmptyString(ann.body) ??
                asNonEmptyString(stripPrefix(message, 'QA FixVersion:'));
            if (value)
                acc.fixVersion = value;
            break;
        }
        case 'qa-sprint-name': {
            const value = asNonEmptyString(ann.body) ??
                asNonEmptyString(stripPrefix(message, 'QA SprintName:'));
            if (value)
                acc.sprintName = value;
            break;
        }
        case 'qa-labels': {
            if (ann.body !== undefined && ann.body !== null) {
                appendLabels(acc, ann.body);
                break;
            }
            appendLabels(acc, stripPrefix(message, 'QA Labels:'));
            break;
        }
        case 'qa-fields': {
            const fromBody = asStringRecord(ann.body);
            if (fromBody) {
                acc.fields = { ...acc.fields, ...fromBody };
                break;
            }
            try {
                const parsed = JSON.parse(stripPrefix(message, 'QA Fields:'));
                const record = asStringRecord(parsed);
                if (record)
                    acc.fields = { ...acc.fields, ...record };
            }
            catch {
                // ignore malformed
            }
            break;
        }
        case 'qa-parameters': {
            const fromBody = asStringRecord(ann.body);
            if (fromBody) {
                acc.parameters = { ...acc.parameters, ...fromBody };
                break;
            }
            try {
                const parsed = JSON.parse(stripPrefix(message, 'QA Parameters:'));
                const record = asStringRecord(parsed);
                if (record)
                    acc.parameters = { ...acc.parameters, ...record };
            }
            catch {
                // ignore malformed
            }
            break;
        }
        case 'qa-issue-key':
        case 'qa-issue-keys': {
            if (ann.body !== undefined && ann.body !== null) {
                appendIssueKeys(acc, ann.body);
                break;
            }
            const prefix = type === 'qa-issue-keys' ? 'QA IssueKeys:' : 'QA IssueKey:';
            appendIssueKeys(acc, stripPrefix(message, prefix));
            break;
        }
        case 'qa-step': {
            const name = typeof ann.body === 'string'
                ? ann.body
                : stripPrefix(message, 'QA Step:');
            if (name)
                acc.steps.push({ name, status: 'passed' });
            break;
        }
        case 'qa-step-start': {
            // WDIO helpers emit start; same as qa-step for accumulator
            const name = typeof ann.body === 'string'
                ? ann.body
                : stripPrefix(message, 'QA Step Start:');
            if (name)
                acc.steps.push({ name, status: 'passed' });
            break;
        }
        case 'qa-step-end': {
            const name = isRecord(ann.body) && typeof ann.body.name === 'string'
                ? ann.body.name
                : stripPrefix(message, 'QA Step End:');
            const status = isRecord(ann.body) && ann.body.status === 'failed' ? 'failed' : 'passed';
            const step = [...acc.steps].reverse().find((s) => s.name === name);
            if (step)
                step.status = status;
            break;
        }
        case 'qa-step-failed': {
            const name = isRecord(ann.body) && typeof ann.body.name === 'string'
                ? ann.body.name
                : stripPrefix(message, 'QA Step Failed:');
            const step = [...acc.steps].reverse().find((s) => s.name === name);
            if (step)
                step.status = 'failed';
            else if (name)
                acc.steps.push({ name, status: 'failed' });
            break;
        }
        case 'qa-attach': {
            if (isRecord(ann.body)) {
                acc.attachments.push({
                    file_name: typeof ann.body.name === 'string' ? ann.body.name : undefined,
                    mime_type: typeof ann.body.contentType === 'string'
                        ? ann.body.contentType
                        : typeof ann.body.type === 'string'
                            ? ann.body.type
                            : undefined,
                    size: typeof ann.body.size === 'number' ? ann.body.size : undefined,
                    content_ref: typeof ann.body.content_ref === 'string'
                        ? ann.body.content_ref
                        : typeof ann.body.contentRef === 'string'
                            ? ann.body.contentRef
                            : undefined,
                });
            }
            else {
                acc.attachments.push({
                    file_name: stripPrefix(message, 'QA Attach:') || undefined,
                });
            }
            break;
        }
        case 'qa-ignore':
            acc.ignore = true;
            break;
        default:
            break;
    }
}
function applyQaAnnotations(acc, annotations) {
    for (const ann of annotations) {
        applyQaAnnotation(acc, ann);
    }
}
function defaultReporterName(framework) {
    if (framework === 'jest')
        return '@ai-testing-tool/forge-jest';
    if (framework === 'mocha')
        return '@ai-testing-tool/forge-mocha';
    if (framework === 'cucumberjs')
        return '@ai-testing-tool/forge-cucumberjs';
    if (framework === 'cypress')
        return '@ai-testing-tool/forge-cypress';
    if (framework === 'playwright')
        return '@ai-testing-tool/forge-playwright';
    if (framework === 'wdio')
        return '@ai-testing-tool/forge-wdio';
    return '@ai-testing-tool/forge-vitest';
}
let cachedHostEnv;
function detectHostEnvironment() {
    const detected = (0, ci_environment_1.detectCiEnvironment)();
    const ci = {};
    if (detected.ciPlatform)
        ci.platform = detected.ciPlatform;
    if (detected.buildUrl)
        ci.buildUrl = detected.buildUrl;
    const git = {};
    if (detected.gitCommitSha)
        git.commitSha = detected.gitCommitSha;
    if (detected.gitBranch)
        git.branch = detected.gitBranch;
    if (detected.gitAuthorName)
        git.authorName = detected.gitAuthorName;
    if (detected.gitAuthorEmail)
        git.authorEmail = detected.gitAuthorEmail;
    return {
        ci: Object.keys(ci).length > 0 ? ci : undefined,
        git: Object.keys(git).length > 0 ? git : undefined,
    };
}
/** Resolve CI/git once per process for meta.qa.host (overridable via options). */
function resolveHostEnvironment(options) {
    if (!cachedHostEnv) {
        cachedHostEnv = detectHostEnvironment();
    }
    return {
        ci: options?.ci !== undefined ? options.ci : cachedHostEnv.ci,
        git: options?.git !== undefined ? options.git : cachedHostEnv.git,
    };
}
/** Test helper — clear memoized CI/git host environment. */
function resetHostEnvironmentCache() {
    cachedHostEnv = undefined;
}
function buildHost(options) {
    const env = resolveHostEnvironment(options);
    const host = {
        framework: options.framework,
        reporter: options.reporter ?? defaultReporterName(options.framework),
    };
    if (env.ci && Object.keys(env.ci).length > 0)
        host.ci = env.ci;
    if (env.git && Object.keys(env.git).length > 0)
        host.git = env.git;
    return host;
}
/** Returns undefined when accumulator has no QA data (omit empty meta.qa). */
function toQaMetaWire(acc, options) {
    const hasData = acc.title !== undefined ||
        acc.comment !== undefined ||
        acc.suite !== undefined ||
        acc.suiteId !== undefined ||
        acc.planId !== undefined ||
        acc.planName !== undefined ||
        acc.fixVersion !== undefined ||
        acc.sprintName !== undefined ||
        (acc.fields && Object.keys(acc.fields).length > 0) ||
        (acc.parameters && Object.keys(acc.parameters).length > 0) ||
        acc.labels.length > 0 ||
        acc.issueKeys.length > 0 ||
        acc.steps.length > 0 ||
        acc.attachments.length > 0 ||
        acc.ignore === true;
    if (!hasData)
        return undefined;
    const wire = {
        framework: options.framework,
        host: buildHost(options),
    };
    if (acc.title !== undefined)
        wire.title = acc.title;
    if (acc.comment !== undefined)
        wire.comment = acc.comment;
    if (acc.fields && Object.keys(acc.fields).length > 0)
        wire.fields = acc.fields;
    if (acc.parameters && Object.keys(acc.parameters).length > 0) {
        wire.parameters = acc.parameters;
    }
    if (acc.suiteId !== undefined)
        wire.suiteId = acc.suiteId;
    if (acc.planId !== undefined)
        wire.planId = acc.planId;
    if (acc.planName !== undefined)
        wire.planName = acc.planName;
    if (acc.fixVersion !== undefined)
        wire.fixVersion = acc.fixVersion;
    if (acc.sprintName !== undefined)
        wire.sprintName = acc.sprintName;
    if (acc.labels.length > 0)
        wire.labels = [...acc.labels];
    if (acc.issueKeys.length > 0)
        wire.issueKeys = [...acc.issueKeys];
    if (acc.suite) {
        wire.suite = acc.suite.split('\t').filter(Boolean).map((title) => ({ title }));
    }
    if (acc.steps.length > 0) {
        wire.steps = acc.steps.map((step, index) => ({
            id: `s${index + 1}`,
            stepType: 'text',
            name: step.name,
            status: step.status,
        }));
    }
    if (acc.attachments.length > 0)
        wire.attachments = acc.attachments;
    if (acc.ignore)
        wire.ignore = true;
    return wire;
}
/** Build meta.qa from typed helper buffer entries (`{ type, body }`). */
function qaMetaFromEntries(entries, options) {
    const acc = createQaMetaAccumulator();
    for (const entry of entries) {
        applyQaAnnotation(acc, { type: entry.type, body: entry.body });
    }
    return toQaMetaWire(acc, options);
}
