/**
 * Cypress task bridge for `qa-cypress/mocha` helpers.
 * Register in setupNodeEvents:
 *   require('qa-cypress/metadata')(on);
 */
type TaskOn = {
    (event: 'task', tasks: Record<string, (value?: unknown) => unknown>): void;
};
declare function metadata(on: TaskOn): void;
export = metadata;
