/**
 * Cypress task bridge for `@qanalyzer/forge-cypress/mocha` helpers.
 * Register in setupNodeEvents:
 *   require('@qanalyzer/forge-cypress/metadata')(on);
 */
type TaskOn = {
    (event: 'task', tasks: Record<string, (value?: unknown) => unknown>): void;
};
declare function metadata(on: TaskOn): void;
export = metadata;
