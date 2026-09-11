import type { PickleTag } from '@cucumber/messages';

/** Parsed Gherkin tags → AiTestingTool meta (FR52). */
export type CucumberQaTagMeta = {
  title: string | null;
  ignore: boolean;
  suite: string | null;
  suiteId: string | null;
  planId: string | null;
  planName: string | null;
  fixVersion: string | null;
  sprintName: string | null;
  labels: string[];
  fields: Record<string, string>;
  parameters: Record<string, string>;
  /** Issue keys from tags like @AUTH-101 (FR51). */
  issueKeys: string[];
};

const titleRe = /^@[Qq]a[Tt]itle=(.+)$/;
const ignoreRe = /^@[Qq]a[Ii]gnore$/;
const suiteIdRe = /^@[Qq]a[Ss]uite[Ii]d=(.+)$/;
const suiteRe = /^@[Qq]a[Ss]uite=(.+)$/;
const planIdRe = /^@[Qq]a[Pp]lan[Ii]d=(.+)$/;
const planRe = /^@[Qq]a[Pp]lan=(.+)$/;
const fixVersionRe = /^@[Qq]a[Ff]ix[Vv]ersion=(.+)$/;
const sprintNameRe = /^@[Qq]a[Ss]print[Nn]ame=(.+)$/;
const labelsRe = /^@[Qq]a[Ll]abels=(.+)$/;
const fieldsRe = /^@[Qq]a[Ff]ields=(.+)$/;
const parametersRe = /^@[Qq]a[Pp]arameters=(.+)$/;
const issueKeyRe = /^@([A-Z][A-Z0-9]+-\d+)$/;

function normalizeJsonString(value: string): string {
  return value.replace(/'/g, '"');
}

function tryParseRecord(raw: string): Record<string, string> {
  try {
    const parsed = JSON.parse(normalizeJsonString(raw)) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed)) {
      out[k] = String(v);
    }
    return out;
  } catch {
    return {};
  }
}

function appendLabels(target: string[], raw: string): void {
  for (const part of raw.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean)) {
    if (!target.includes(part)) target.push(part);
  }
}

type TagLike = Pick<PickleTag, 'name'> | { name: string };

/**
 * Parse `@Qa*` and issue-key tags from a pickle.
 * No competitor tag names — destination is Jira.
 */
export function parseQaTags(tags: readonly TagLike[]): CucumberQaTagMeta {
  const meta: CucumberQaTagMeta = {
    title: null,
    ignore: false,
    suite: null,
    suiteId: null,
    planId: null,
    planName: null,
    fixVersion: null,
    sprintName: null,
    labels: [],
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

    const suiteIdMatch = suiteIdRe.exec(name);
    if (suiteIdMatch?.[1]) {
      meta.suiteId = suiteIdMatch[1];
      continue;
    }

    const suiteMatch = suiteRe.exec(name);
    if (suiteMatch?.[1]) {
      meta.suite = suiteMatch[1];
      continue;
    }

    const planIdMatch = planIdRe.exec(name);
    if (planIdMatch?.[1]) {
      meta.planId = planIdMatch[1];
      continue;
    }

    const planMatch = planRe.exec(name);
    if (planMatch?.[1]) {
      meta.planName = planMatch[1].replace(/_/g, ' ');
      continue;
    }

    const fixVersionMatch = fixVersionRe.exec(name);
    if (fixVersionMatch?.[1]) {
      meta.fixVersion = fixVersionMatch[1];
      continue;
    }

    const sprintNameMatch = sprintNameRe.exec(name);
    if (sprintNameMatch?.[1]) {
      meta.sprintName = sprintNameMatch[1].replace(/_/g, ' ');
      continue;
    }

    const labelsMatch = labelsRe.exec(name);
    if (labelsMatch?.[1]) {
      appendLabels(meta.labels, labelsMatch[1]);
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
export function resolveScenarioTitle(
  pickleName: string,
  meta: CucumberQaTagMeta,
): string {
  if (meta.title) return meta.title;
  return pickleName;
}
