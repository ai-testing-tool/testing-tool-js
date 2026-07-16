/**
 * Programmatic helpers for Playwright tests (FR111).
 * Prefer `qa.issueKey()` / `qa.issueKeys()` for FR43 (do not embed keys in titles).
 *
 * Steps: use Playwright native `test.step()` — do **not** use `qa.step` (FR112).
 *
 * In a live Playwright run, metadata is attached via `test.info().attach`.
 * Outside Playwright (unit tests), helpers use an in-process buffer.
 *
 * `qa.attach` with binary content/path uploads via Forge when configured (FR119).
 */

import { uploadAttachmentForQa } from '@qanalyzer/forge-commons';

import {
  MetadataManager,
  QA_METADATA_CONTENT_TYPE,
} from './metadata-manager';

export type QaHelpers = {
  title(value: string): void;
  comment(value: string): void;
  suite(value: string): void;
  fields(values: Record<string, string>): void;
  parameters(values: Record<string, string>): void;
  /** Explicit FR43 issue key (preferred over embedding in titles). */
  issueKey(key: string): void;
  /** Explicit FR43 issue keys (preferred over embedding in titles). */
  issueKeys(keys: string[]): void;
  ignore(): void;
  /** Attach metadata; with content/path, attempts Forge upload (FR119). */
  attach(attach: {
    name?: string;
    contentType?: string;
    content?: string | Buffer;
    path?: string;
    issueKey?: string;
  }): void | Promise<void>;
};

type MetadataMessage = {
  title?: string;
  comment?: string;
  suite?: string;
  fields?: Record<string, string>;
  parameters?: Record<string, string>;
  issueKeys?: string[];
  ignore?: boolean;
  attachments?: Array<{
    name?: string;
    contentType?: string;
    size?: number;
    content_ref?: string;
  }>;
};

function tryCurrentTitle(): string | undefined {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pw = require('@playwright/test') as {
      test?: { info: () => { title?: string } };
    };
    return pw.test?.info?.()?.title;
  } catch {
    return undefined;
  }
}

function tryAttachMetadata(meta: MetadataMessage): boolean {
  try {
    // Lazy require so unit tests run without a Playwright test context.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pw = require('@playwright/test') as {
      test?: {
        info: () => {
          attach: (
            name: string,
            options: { contentType: string; body: Buffer },
          ) => Promise<void>;
        };
      };
    };
    const info = pw.test?.info?.();
    if (!info?.attach) return false;
    void info
      .attach('qanalyzer-metadata.json', {
        contentType: QA_METADATA_CONTENT_TYPE,
        body: Buffer.from(JSON.stringify(meta), 'utf8'),
      })
      .catch(() => {
        // Never fail the test run
      });
    return true;
  } catch {
    return false;
  }
}

function pushMeta(type: string, body: unknown, wire: MetadataMessage): void {
  if (tryAttachMetadata(wire)) return;
  MetadataManager.push(type, body);
}

export const qa: QaHelpers = {
  title(value: string) {
    pushMeta('qa-title', value, { title: value });
  },
  comment(value: string) {
    pushMeta('qa-comment', value, { comment: value });
  },
  suite(value: string) {
    pushMeta('qa-suite', value, { suite: value });
  },
  fields(values: Record<string, string>) {
    pushMeta('qa-fields', values, { fields: values });
  },
  parameters(values: Record<string, string>) {
    pushMeta('qa-parameters', values, { parameters: values });
  },
  issueKey(key: string) {
    pushMeta('qa-issue-key', key, { issueKeys: [key] });
  },
  issueKeys(keys: string[]) {
    pushMeta('qa-issue-keys', keys, { issueKeys: keys });
  },
  ignore() {
    pushMeta('qa-ignore', true, { ignore: true });
  },
  attach(attach) {
    const mime = attach.contentType;
    const hasBinary = attach.content !== undefined || Boolean(attach.path);
    if (!hasBinary) {
      const body = {
        name: attach.name,
        contentType: mime,
      };
      pushMeta('qa-attach', body, { attachments: [body] });
      return;
    }

    return uploadAttachmentForQa({
      fileName: attach.name,
      mimeType: mime,
      content: attach.content,
      path: attach.path,
      issueKey: attach.issueKey,
      issueKeySources: [attach.issueKey, tryCurrentTitle()],
    })
      .then((outcome) => {
        const body = {
          name: outcome.attachment.file_name ?? attach.name,
          contentType: outcome.attachment.mime_type ?? mime,
          size: outcome.attachment.size,
          content_ref: outcome.attachment.content_ref,
        };
        pushMeta('qa-attach', body, { attachments: [body] });
      })
      .catch(() => {
        const body = { name: attach.name, contentType: mime };
        pushMeta('qa-attach', body, { attachments: [body] });
      });
  },
};

export { MetadataManager, QA_METADATA_CONTENT_TYPE };
export type { QaMetaEntry } from './metadata-manager';
