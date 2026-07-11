"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptionsResolver = void 0;
exports.createDefaultConfig = createDefaultConfig;
const env_1 = require("../env");
const options_1 = require("../options");
class OptionsResolver {
    resolve(options = {}) {
        const composed = (0, options_1.composeOptions)(createDefaultConfig(), options, (0, env_1.envToConfig)());
        return {
            effectiveMode: composed.mode ?? options_1.ModeEnum.off,
            effectiveFallback: composed.fallback ?? options_1.ModeEnum.off,
            composed,
        };
    }
}
exports.OptionsResolver = OptionsResolver;
function createDefaultConfig() {
    return {
        mode: options_1.ModeEnum.off,
        fallback: options_1.ModeEnum.off,
        debug: false,
        ingest: {
            timeoutMs: 30_000,
            maxPayloadBytes: 4_500_000,
        },
        file: {
            path: './qanalyzer-results.json',
        },
    };
}
