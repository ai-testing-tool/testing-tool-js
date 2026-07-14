"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FailureScreenshotBuffer = void 0;
const pending = [];
exports.FailureScreenshotBuffer = {
    clear() {
        pending.length = 0;
    },
    add(title, attachment) {
        pending.push({ title, attachment });
    },
    /**
     * Take all shots matching a test title (exact or substring), removing them from the buffer.
     */
    takeForTitle(title) {
        const out = [];
        for (let i = pending.length - 1; i >= 0; i -= 1) {
            const entry = pending[i];
            if (entry.title === title ||
                title.includes(entry.title) ||
                entry.title.includes(title)) {
                out.unshift(entry.attachment);
                pending.splice(i, 1);
            }
        }
        return out;
    },
    /** Drain remaining shots (ordered) for publish-time fallback. */
    takeAll() {
        return pending.splice(0, pending.length);
    },
    size() {
        return pending.length;
    },
};
