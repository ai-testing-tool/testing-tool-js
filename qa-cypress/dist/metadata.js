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
        qaComment(value) {
            metadata_manager_1.MetadataManager.push('qa-comment', value);
            return null;
        },
        qaParameters(value) {
            metadata_manager_1.MetadataManager.push('qa-parameters', value);
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
