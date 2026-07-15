/**
 * Cypress task bridge for `qa-forge-cypress/mocha` helpers.
 * Register in setupNodeEvents:
 *   require('qa-forge-cypress/metadata')(on);
 */
type TaskOn = {
    (event: 'task', tasks: Record<string, (value?: unknown) => unknown>): void;
};
declare function metadata(on: TaskOn): void;
export = metadata;
