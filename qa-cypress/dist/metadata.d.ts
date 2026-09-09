/**
 * Cypress task bridge for `@ai-testing-tool/forge-cypress/mocha` helpers.
 * Register in setupNodeEvents:
 *   require('@ai-testing-tool/forge-cypress/metadata')(on);
 */
type TaskOn = {
    (event: 'task', tasks: Record<string, (value?: unknown) => unknown>): void;
};
declare function metadata(on: TaskOn): void;
export = metadata;
