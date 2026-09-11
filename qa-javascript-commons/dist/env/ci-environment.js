"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectCiEnvironment = detectCiEnvironment;
function tryGit(args) {
    try {
        // Lazy require so environments without child_process still load this module.
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { execFileSync } = require('node:child_process');
        const out = execFileSync('git', args, {
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'ignore'],
            timeout: 2_000,
        });
        const trimmed = typeof out === 'string' ? out.trim() : '';
        return trimmed || undefined;
    }
    catch {
        return undefined;
    }
}
function firstDefined(...values) {
    for (const value of values) {
        const resolved = typeof value === 'function' ? value() : value;
        if (resolved !== undefined && resolved !== '')
            return resolved;
    }
    return undefined;
}
/** Best-effort CI metadata from common provider env vars (+ local git fallback). */
function detectCiEnvironment() {
    const github = process.env.GITHUB_ACTIONS === 'true';
    const gitlab = Boolean(process.env.GITLAB_CI);
    const azure = Boolean(process.env.TF_BUILD);
    const bitbucket = Boolean(process.env.BITBUCKET_BUILD_NUMBER);
    const teamcity = Boolean(process.env.TEAMCITY_VERSION);
    const jenkins = Boolean(process.env.JENKINS_URL);
    let ciPlatform;
    let buildUrl;
    if (github) {
        ciPlatform = 'github';
        const server = process.env.GITHUB_SERVER_URL ?? 'https://github.com';
        const repo = process.env.GITHUB_REPOSITORY;
        const runId = process.env.GITHUB_RUN_ID;
        if (repo && runId) {
            buildUrl = `${server}/${repo}/actions/runs/${runId}`;
        }
    }
    else if (gitlab) {
        ciPlatform = 'gitlab';
        buildUrl = process.env.CI_PIPELINE_URL;
    }
    else if (azure) {
        ciPlatform = 'azure-devops';
        const collection = process.env.SYSTEM_TEAMFOUNDATIONCOLLECTIONURI;
        const project = process.env.SYSTEM_TEAMPROJECT;
        const buildId = process.env.BUILD_BUILDID;
        if (collection && project && buildId) {
            buildUrl = `${collection}${project}/_build/results?buildId=${buildId}`;
        }
    }
    else if (bitbucket) {
        ciPlatform = 'bitbucket';
        buildUrl = process.env.BITBUCKET_GIT_HTTP_ORIGIN;
    }
    else if (teamcity) {
        ciPlatform = 'teamcity';
        buildUrl = process.env.BUILD_URL;
    }
    else if (jenkins) {
        ciPlatform = 'jenkins';
        buildUrl = process.env.BUILD_URL;
    }
    return {
        ciPlatform,
        buildUrl,
        gitCommitSha: firstDefined(process.env.GITHUB_SHA, process.env.CI_COMMIT_SHA, process.env.BUILD_SOURCEVERSION, process.env.BITBUCKET_COMMIT, process.env.GIT_COMMIT, () => tryGit(['rev-parse', 'HEAD'])),
        gitBranch: firstDefined(process.env.GITHUB_REF_NAME, process.env.CI_COMMIT_REF_NAME, process.env.BUILD_SOURCEBRANCHNAME, process.env.BITBUCKET_BRANCH, process.env.GIT_BRANCH, () => {
            const ref = tryGit(['rev-parse', '--abbrev-ref', 'HEAD']);
            return ref === 'HEAD' ? undefined : ref;
        }),
        gitAuthorName: firstDefined(process.env.GITHUB_ACTOR, process.env.GITLAB_USER_NAME, process.env.GIT_AUTHOR_NAME, () => tryGit(['log', '-1', '--pretty=format:%an'])),
        gitAuthorEmail: firstDefined(process.env.GITLAB_USER_EMAIL, process.env.GIT_AUTHOR_EMAIL, () => tryGit(['log', '-1', '--pretty=format:%ae'])),
    };
}
