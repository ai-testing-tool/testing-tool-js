"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listCiTemplateVariants = listCiTemplateVariants;
exports.generateCiTemplate = generateCiTemplate;
const context_1 = require("./context");
const azure_devops_1 = require("./templates/azure-devops");
const bitbucket_1 = require("./templates/bitbucket");
const github_1 = require("./templates/github");
const gitlab_1 = require("./templates/gitlab");
const jenkins_1 = require("./templates/jenkins");
const types_1 = require("./types");
const PLATFORMS = [
    'github',
    'gitlab',
    'azure-devops',
    'jenkins',
    'bitbucket',
];
const UPLOAD_FRAMEWORKS = ['vitest', 'jest', 'playwright'];
const REPORTER_FRAMEWORKS = [
    'vitest',
    'jest',
    'mocha',
    'cucumberjs',
    'cypress',
    'playwright',
    'wdio',
];
/**
 * Upload path: Vitest, Jest, Playwright (JSON + @qanalyzer/forge-api-client).
 * Reporter path: Vitest, Jest, Mocha, CucumberJS, Cypress, Playwright, WebdriverIO.
 * Mocha / CucumberJS / Cypress / WDIO have no upload JSON dual-path — use mode=file via reporter instead.
 */
const SUPPORTED_VARIANTS = [
    ...PLATFORMS.flatMap((platform) => UPLOAD_FRAMEWORKS.map((framework) => ({
        platform,
        framework,
        ingestPath: 'upload',
    }))),
    ...PLATFORMS.flatMap((platform) => REPORTER_FRAMEWORKS.map((framework) => ({
        platform,
        framework,
        ingestPath: 'reporter',
    }))),
];
function isSupported(ctx) {
    return SUPPORTED_VARIANTS.some((v) => v.platform === ctx.platform &&
        v.framework === ctx.framework &&
        v.ingestPath === ctx.ingestPath);
}
function listCiTemplateVariants() {
    return [...SUPPORTED_VARIANTS];
}
/**
 * Generate a CI YAML (or equivalent) snippet for the given context.
 * Accepts a partial context — fills platform defaults via buildCiTemplateContext.
 */
function generateCiTemplate(input) {
    const ctx = (0, context_1.buildCiTemplateContext)(input);
    if (!isSupported(ctx)) {
        throw new types_1.UnsupportedVariantError(ctx.platform, ctx.framework, ctx.ingestPath);
    }
    switch (ctx.platform) {
        case 'github':
            return (0, github_1.renderGithubUpload)(ctx);
        case 'gitlab':
            return (0, gitlab_1.renderGitlabUpload)(ctx);
        case 'azure-devops':
            return (0, azure_devops_1.renderAzureDevOpsUpload)(ctx);
        case 'jenkins':
            return (0, jenkins_1.renderJenkinsUpload)(ctx);
        case 'bitbucket':
            return (0, bitbucket_1.renderBitbucketUpload)(ctx);
        default: {
            const _exhaustive = ctx.platform;
            throw new types_1.UnsupportedVariantError(_exhaustive, ctx.framework, ctx.ingestPath);
        }
    }
}
