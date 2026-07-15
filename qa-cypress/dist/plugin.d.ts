/**
 * Cypress Node plugin — register in cypress.config.js setupNodeEvents:
 *   require('qa-forge-cypress/plugin')(on, config);
 *
 * before:run clears the results bridge; after:run publishes FR41
 * (mode=ingest | file) via qa-forge-commons.
 * after:screenshot captures failure still images for Phase 3 upload (FR71).
 */
type PluginOn = {
    (event: string, handler: (...args: unknown[]) => unknown): void;
};
type PluginConfig = Record<string, unknown> & {
    projectRoot?: string;
    reporterOptions?: Record<string, unknown> | null;
};
declare function plugin(on: PluginOn, config: PluginConfig): PluginConfig;
export = plugin;
