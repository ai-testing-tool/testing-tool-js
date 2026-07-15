/**
 * Buffer for failure still-image wire metadata between service afterTest and publish (FR133).
 */
import type { QaMetaAttachmentWire } from 'qa-forge-commons';

type ShotEntry = {
  title: string;
  attachment: QaMetaAttachmentWire;
};

const pending: ShotEntry[] = [];

export const FailureScreenshotBuffer = {
  clear(): void {
    pending.length = 0;
  },

  add(title: string, attachment: QaMetaAttachmentWire): void {
    pending.push({ title, attachment });
  },

  /**
   * Take all shots matching a test title (exact or substring), removing them from the buffer.
   */
  takeForTitle(title: string): QaMetaAttachmentWire[] {
    const out: QaMetaAttachmentWire[] = [];
    for (let i = pending.length - 1; i >= 0; i -= 1) {
      const entry = pending[i]!;
      if (
        entry.title === title ||
        title.includes(entry.title) ||
        entry.title.includes(title)
      ) {
        out.unshift(entry.attachment);
        pending.splice(i, 1);
      }
    }
    return out;
  },

  /** Drain remaining shots (ordered) for publish-time fallback. */
  takeAll(): ShotEntry[] {
    return pending.splice(0, pending.length);
  },

  size(): number {
    return pending.length;
  },
};
