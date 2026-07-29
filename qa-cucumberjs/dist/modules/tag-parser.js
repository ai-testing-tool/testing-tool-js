"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseQaTags = parseQaTags;
exports.resolveScenarioTitle = resolveScenarioTitle;
const titleRe = /^@[Qq]a[Tt]itle=(.+)$/;
const ignoreRe = /^@[Qq]a[Ii]gnore$/;
const suiteRe = /^@[Qq]a[Ss]uite=(.+)$/;
const fieldsRe = /^@[Qq]a[Ff]ields=(.+)$/;
const parametersRe = /^@[Qq]a[Pp]arameters=(.+)$/;
const issueKeyRe = /^@([A-Z][A-Z0-9]+-\d+)$/;
function normalizeJsonString(value) {
    return value.replace(/'/g, '"');
}
function tryParseRecord(raw) {
    try {
        const parsed = JSON.parse(normalizeJsonString(raw));
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            return {};
        }
        const out = {};
        for (const [k, v] of Object.entries(parsed)) {
            out[k] = String(v);
        }
        return out;
    }
    catch {
        return {};
    }
}
/**
 * Parse `@Qa*` and issue-key tags from a pickle.
 * No competitor tag names — destination is Jira.
 */
function parseQaTags(tags) {
    const meta = {
        title: null,
        ignore: false,
        suite: null,
        fields: {},
        parameters: {},
        issueKeys: [],
    };
    for (const tag of tags) {
        const name = tag.name;
        if (ignoreRe.test(name)) {
            meta.ignore = true;
            continue;
        }
        const titleMatch = titleRe.exec(name);
        if (titleMatch?.[1]) {
            meta.title = titleMatch[1].replace(/_/g, ' ');
            continue;
        }
        const suiteMatch = suiteRe.exec(name);
        if (suiteMatch?.[1]) {
            meta.suite = suiteMatch[1];
            continue;
        }
        const fieldsMatch = fieldsRe.exec(name);
        if (fieldsMatch?.[1]) {
            meta.fields = { ...meta.fields, ...tryParseRecord(fieldsMatch[1]) };
            continue;
        }
        const paramsMatch = parametersRe.exec(name);
        if (paramsMatch?.[1]) {
            meta.parameters = {
                ...meta.parameters,
                ...tryParseRecord(paramsMatch[1]),
            };
            continue;
        }
        const issueMatch = issueKeyRe.exec(name);
        if (issueMatch?.[1]) {
            meta.issueKeys.push(issueMatch[1]);
        }
    }
    return meta;
}
/** Prefer `@title:` tag value; otherwise keep the pickle name as-is (no issue-key prefix). */
function resolveScenarioTitle(pickleName, meta) {
    if (meta.title)
        return meta.title;
    return pickleName;
}
