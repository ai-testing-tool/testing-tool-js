"use strict";
const metadata_manager_1 = require("./metadata-manager");
function metadata(on) {
    on('task', {
        qaTitle(value) {
            metadata_manager_1.MetadataManager.push('qa-title', value);
            return null;
        },
        qaSuite(value) {
            metadata_manager_1.MetadataManager.push('qa-suite', value);
            return null;
        },
        qaSuiteId(value) {
            metadata_manager_1.MetadataManager.push('qa-suite-id', value);
            return null;
        },
        qaPlanId(value) {
            metadata_manager_1.MetadataManager.push('qa-plan-id', value);
            return null;
        },
        qaPlan(value) {
            metadata_manager_1.MetadataManager.push('qa-plan', value);
            return null;
        },
        qaFixVersion(value) {
            metadata_manager_1.MetadataManager.push('qa-fix-version', value);
            return null;
        },
        qaSprintName(value) {
            metadata_manager_1.MetadataManager.push('qa-sprint-name', value);
            return null;
        },
        qaLabels(value) {
            metadata_manager_1.MetadataManager.push('qa-labels', value);
            return null;
        },
        qaComment(value) {
            metadata_manager_1.MetadataManager.push('qa-comment', value);
            return null;
        },
        qaParameters(value) {
            metadata_manager_1.MetadataManager.push('qa-parameters', value);
            return null;
        },
        qaIssueKey(value) {
            metadata_manager_1.MetadataManager.push('qa-issue-key', value);
            return null;
        },
        qaIssueKeys(value) {
            metadata_manager_1.MetadataManager.push('qa-issue-keys', value);
            return null;
        },
        qaIgnore() {
            metadata_manager_1.MetadataManager.push('qa-ignore', true);
            return null;
        },
        qaStepStart(value) {
            metadata_manager_1.MetadataManager.push('qa-step', value);
            return null;
        },
        qaStepEnd(value) {
            metadata_manager_1.MetadataManager.push('qa-step-end', value);
            return null;
        },
    });
}
module.exports = metadata;
