"use strict";
/**
 * FR41 wire shape for `assertionResults[].meta.qa`
 * (architecture ingest contract — simplified TestResultType serialization).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createQaMetaAccumulator = createQaMetaAccumulator;
exports.applyQaAnnotation = applyQaAnnotation;
exports.applyQaAnnotations = applyQaAnnotations;
exports.toQaMetaWire = toQaMetaWire;
exports.qaMetaFromEntries = qaMetaFromEntries;
function createQaMetaAccumulator() {
    return { steps: [], attachments: [] };
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
    if (message.startsWith('QA Suite:'))
        return 'qa-suite';
    if (message.startsWith('QA Fields:'))
        return 'qa-fields';
    if (message.startsWith('QA Parameters:'))
        return 'qa-parameters';
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
        return 'qa-jest';
    if (framework === 'mocha')
        return 'qa-mocha';
    if (framework === 'cucumberjs')
        return 'qa-cucumberjs';
    if (framework === 'cypress')
        return 'qa-cypress';
    if (framework === 'playwright')
        return 'qa-playwright';
    if (framework === 'wdio')
        return 'qa-wdio';
    return 'qa-vitest';
}
/** Returns undefined when accumulator has no QA data (omit empty meta.qa). */
function toQaMetaWire(acc, options) {
    const hasData = acc.title !== undefined ||
        acc.comment !== undefined ||
        acc.suite !== undefined ||
        (acc.fields && Object.keys(acc.fields).length > 0) ||
        (acc.parameters && Object.keys(acc.parameters).length > 0) ||
        acc.steps.length > 0 ||
        acc.attachments.length > 0 ||
        acc.ignore === true;
    if (!hasData)
        return undefined;
    const wire = {
        framework: options.framework,
        host: {
            framework: options.framework,
            reporter: options.reporter ?? defaultReporterName(options.framework),
        },
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
