"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnsupportedVariantError = void 0;
class UnsupportedVariantError extends Error {
    platform;
    framework;
    ingestPath;
    constructor(platform, framework, ingestPath) {
        super(`Unsupported CI template variant: ${platform} / ${framework} / ${ingestPath}`);
        this.name = 'UnsupportedVariantError';
        this.platform = platform;
        this.framework = framework;
        this.ingestPath = ingestPath;
    }
}
exports.UnsupportedVariantError = UnsupportedVariantError;
