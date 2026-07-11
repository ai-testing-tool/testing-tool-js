"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FallbackCoordinator = void 0;
/** Upstream ingest → fallback file cascade. */
class FallbackCoordinator {
    logger;
    upstream;
    fallback;
    callbacks;
    useFallback = false;
    disabled = false;
    onDisabledFired = false;
    constructor(logger, upstream, fallback, callbacks = {}) {
        this.logger = logger;
        this.upstream = upstream;
        this.fallback = fallback;
        this.callbacks = callbacks;
    }
    isDisabled() {
        return this.disabled;
    }
    setDisabled(value) {
        this.disabled = value;
    }
    async run(op, opName) {
        if (this.disabled)
            return undefined;
        if (this.useFallback) {
            return this.runOnFallback(op, opName);
        }
        if (!this.upstream) {
            if (!this.fallback)
                return undefined;
            this.useFallback = true;
            return this.runOnFallback(op, opName);
        }
        try {
            return await op(this.upstream);
        }
        catch (error) {
            this.logger.logError(`Unable to ${opName} in the upstream reporter`, error);
            this.callbacks.onUpstreamFailure?.();
            if (!this.fallback) {
                this.disable();
                return undefined;
            }
            this.useFallback = true;
            this.callbacks.onFallbackActivated?.();
            return this.runOnFallback(op, opName);
        }
    }
    disable() {
        if (this.disabled)
            return;
        this.disabled = true;
        if (!this.onDisabledFired) {
            this.onDisabledFired = true;
            this.callbacks.onDisabled?.();
        }
    }
    async runOnFallback(op, opName) {
        if (!this.fallback) {
            this.disable();
            return undefined;
        }
        try {
            return await op(this.fallback);
        }
        catch (error) {
            this.logger.logError(`Unable to ${opName} in the fallback reporter`, error);
            this.callbacks.onFallbackFailure?.();
            this.disable();
            return undefined;
        }
    }
}
exports.FallbackCoordinator = FallbackCoordinator;
