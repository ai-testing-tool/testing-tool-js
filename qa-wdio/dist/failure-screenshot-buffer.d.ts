/**
 * Buffer for failure still-image wire metadata between service afterTest and publish (FR133).
 */
import type { QaMetaAttachmentWire } from 'qa-forge-commons';
type ShotEntry = {
    title: string;
    attachment: QaMetaAttachmentWire;
};
export declare const FailureScreenshotBuffer: {
    clear(): void;
    add(title: string, attachment: QaMetaAttachmentWire): void;
    /**
     * Take all shots matching a test title (exact or substring), removing them from the buffer.
     */
    takeForTitle(title: string): QaMetaAttachmentWire[];
    /** Drain remaining shots (ordered) for publish-time fallback. */
    takeAll(): ShotEntry[];
    size(): number;
};
export {};
