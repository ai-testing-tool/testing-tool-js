import { MetadataManager } from './metadata-manager';

/**
 * Cypress task bridge for `qa-forge-cypress/mocha` helpers.
 * Register in setupNodeEvents:
 *   require('qa-forge-cypress/metadata')(on);
 */

type TaskOn = {
  (event: 'task', tasks: Record<string, (value?: unknown) => unknown>): void;
};

function metadata(on: TaskOn): void {
  on('task', {
    qaTitle(value: unknown) {
      MetadataManager.push('qa-title', value);
      return null;
    },
    qaSuite(value: unknown) {
      MetadataManager.push('qa-suite', value);
      return null;
    },
    qaComment(value: unknown) {
      MetadataManager.push('qa-comment', value);
      return null;
    },
    qaParameters(value: unknown) {
      MetadataManager.push('qa-parameters', value);
      return null;
    },
    qaIgnore() {
      MetadataManager.push('qa-ignore', true);
      return null;
    },
    qaStepStart(value: unknown) {
      MetadataManager.push('qa-step', value);
      return null;
    },
    qaStepEnd(value: unknown) {
      MetadataManager.push('qa-step-end', value);
      return null;
    },
  });
}

export = metadata;
