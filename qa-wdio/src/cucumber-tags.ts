/**
 * Map WDIO Cucumber tags → MetadataManager / issue-key sources (FR135 / FR43).
 * Supports `@QaSuite=…`, `@QaSuiteId=…`, `@QaPlan=…`, `@QaPlanId=…`,
 * `@QaFixVersion=…`, `@QaSprintName=…`, `@QaLabels=…`, `@QaTitle=…`,
 * `@QaFields=…` plus bare `@PROJ-123` issue keys.
 * Does not handle Qase `@QaseId`.
 */

import { MetadataManager } from './metadata-manager';

export type TagLike = {
  name: string;
};

const ISSUE_KEY_TAG_RE = /^@?([A-Z][A-Z0-9]+-\d+)$/;

function parseKeyValueTag(tag: string): { key: string; value: string } | null {
  const raw = tag.startsWith('@') ? tag : `@${tag}`;
  const eq = raw.indexOf('=');
  if (eq <= 0) return null;
  const key = raw.slice(0, eq);
  const value = raw.slice(eq + 1).trim();
  if (!key || !value) return null;
  return { key, value };
}

function extractBareIssueKey(tag: string): string | null {
  const m = tag.match(ISSUE_KEY_TAG_RE);
  return m?.[1] ?? null;
}

export type CucumberTagApplyResult = {
  issueKeys: string[];
};

/**
 * Apply Cucumber scenario tags onto MetadataManager; return bare issue keys.
 */
export function applyCucumberTags(tags: readonly TagLike[]): CucumberTagApplyResult {
  const issueKeys: string[] = [];

  for (const tag of tags) {
    const name = typeof tag?.name === 'string' ? tag.name.trim() : '';
    if (!name) continue;

    const kv = parseKeyValueTag(name);
    if (kv) {
      switch (kv.key.toLowerCase()) {
        case '@qasuite':
          MetadataManager.push('qa-suite', kv.value);
          break;
        case '@qasuiteid':
          MetadataManager.push('qa-suite-id', kv.value);
          break;
        case '@qaplanid':
          MetadataManager.push('qa-plan-id', kv.value);
          break;
        case '@qaplan':
          MetadataManager.push('qa-plan', kv.value.replace(/_/g, ' '));
          break;
        case '@qafixversion':
          MetadataManager.push('qa-fix-version', kv.value);
          break;
        case '@qasprintname':
          MetadataManager.push('qa-sprint-name', kv.value.replace(/_/g, ' '));
          break;
        case '@qalabels':
          MetadataManager.push('qa-labels', kv.value);
          break;
        case '@qafields': {
          try {
            const parsed = JSON.parse(kv.value.replace(/'/g, '"')) as unknown;
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
              MetadataManager.push('qa-fields', parsed);
            }
          } catch {
            // ignore invalid JSON
          }
          break;
        }
        case '@qatitle':
          MetadataManager.push('qa-title', kv.value);
          break;
        default:
          break;
      }
      continue;
    }

    const issueKey = extractBareIssueKey(name);
    if (issueKey) {
      issueKeys.push(issueKey);
    }
  }

  return { issueKeys };
}
