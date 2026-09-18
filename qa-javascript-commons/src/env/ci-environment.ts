export type CiMetadata = {
  ciPlatform?: string;
  ciBuildUrl?: string;
  gitCommitSha?: string;
  gitBranch?: string;
  gitAuthorName?: string;
  gitHashCommitUrl?: string;
};

function tryGit(args: string[]): string | undefined {
  try {
    // Lazy require so environments without child_process still load this module.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { execFileSync } = require('node:child_process') as typeof import('node:child_process');
    const out = execFileSync('git', args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 2_000,
    });
    const trimmed = typeof out === 'string' ? out.trim() : '';
    return trimmed || undefined;
  } catch {
    return undefined;
  }
}

function firstDefined(
  ...values: Array<string | undefined | (() => string | undefined)>
): string | undefined {
  for (const value of values) {
    const resolved = typeof value === 'function' ? value() : value;
    if (resolved !== undefined && resolved !== '') return resolved;
  }
  return undefined;
}

function commitUrlFromRemote(sha: string): string | undefined {
  const remote = tryGit(['config', '--get', 'remote.origin.url']);
  if (!remote) return undefined;

  // git@host:org/repo.git or https://host/org/repo.git(.git)
  const ssh = remote.match(/^git@([^:]+):(.+?)(?:\.git)?$/i);
  const https = remote.match(/^https?:\/\/([^/]+)\/(.+?)(?:\.git)?$/i);
  const host = ssh?.[1] ?? https?.[1];
  const path = (ssh?.[2] ?? https?.[2])?.replace(/\/$/, '');
  if (!host || !path) return undefined;

  if (host.includes('bitbucket')) {
    return `https://${host}/${path}/commits/${sha}`;
  }
  if (host.includes('dev.azure.com') || host.includes('visualstudio.com')) {
    return `https://${host}/${path}/commit/${sha}`;
  }
  // GitHub, GitLab, and most forge UIs use /commit/<sha>
  return `https://${host}/${path}/commit/${sha}`;
}

/** Best-effort CI metadata from common provider env vars (+ local git fallback). */
export function detectCiEnvironment(): CiMetadata {
  const github = process.env.GITHUB_ACTIONS === 'true';
  const gitlab = Boolean(process.env.GITLAB_CI);
  const azure = Boolean(process.env.TF_BUILD);
  const bitbucket = Boolean(process.env.BITBUCKET_BUILD_NUMBER);
  const teamcity = Boolean(process.env.TEAMCITY_VERSION);
  const jenkins = Boolean(process.env.JENKINS_URL);

  let ciPlatform: string | undefined;
  let ciBuildUrl: string | undefined;
  let gitHashCommitUrl: string | undefined;

  const gitCommitSha = firstDefined(
    process.env.GITHUB_SHA,
    process.env.CI_COMMIT_SHA,
    process.env.BUILD_SOURCEVERSION,
    process.env.BITBUCKET_COMMIT,
    process.env.GIT_COMMIT,
    () => tryGit(['rev-parse', 'HEAD']),
  );

  if (github) {
    ciPlatform = 'github';
    const server = process.env.GITHUB_SERVER_URL ?? 'https://github.com';
    const repo = process.env.GITHUB_REPOSITORY;
    const runId = process.env.GITHUB_RUN_ID;
    if (repo && runId) {
      ciBuildUrl = `${server}/${repo}/actions/runs/${runId}`;
    }
    if (repo && gitCommitSha) {
      gitHashCommitUrl = `${server}/${repo}/commit/${gitCommitSha}`;
    }
  } else if (gitlab) {
    ciPlatform = 'gitlab';
    ciBuildUrl = process.env.CI_PIPELINE_URL;
    gitHashCommitUrl = process.env.CI_COMMIT_URL;
  } else if (azure) {
    ciPlatform = 'azure-devops';
    const collection = process.env.SYSTEM_TEAMFOUNDATIONCOLLECTIONURI;
    const project = process.env.SYSTEM_TEAMPROJECT;
    const buildId = process.env.BUILD_BUILDID;
    const repoName = process.env.BUILD_REPOSITORY_NAME;
    if (collection && project && buildId) {
      ciBuildUrl = `${collection}${project}/_build/results?buildId=${buildId}`;
    }
    if (collection && project && repoName && gitCommitSha) {
      gitHashCommitUrl = `${collection}${project}/_git/${repoName}/commit/${gitCommitSha}`;
    }
  } else if (bitbucket) {
    ciPlatform = 'bitbucket';
    ciBuildUrl = process.env.BITBUCKET_GIT_HTTP_ORIGIN;
    const workspace = process.env.BITBUCKET_WORKSPACE;
    const repoSlug = process.env.BITBUCKET_REPO_SLUG;
    if (workspace && repoSlug && gitCommitSha) {
      gitHashCommitUrl = `https://bitbucket.org/${workspace}/${repoSlug}/commits/${gitCommitSha}`;
    }
  } else if (teamcity) {
    ciPlatform = 'teamcity';
    ciBuildUrl = process.env.BUILD_URL;
  } else if (jenkins) {
    ciPlatform = 'jenkins';
    ciBuildUrl = process.env.BUILD_URL;
  }

  if (!gitHashCommitUrl && gitCommitSha) {
    gitHashCommitUrl = commitUrlFromRemote(gitCommitSha);
  }

  return {
    ciPlatform,
    ciBuildUrl,
    gitCommitSha,
    gitBranch: firstDefined(
      process.env.GITHUB_REF_NAME,
      process.env.CI_COMMIT_REF_NAME,
      process.env.BUILD_SOURCEBRANCHNAME,
      process.env.BITBUCKET_BRANCH,
      process.env.GIT_BRANCH,
      () => {
        const ref = tryGit(['rev-parse', '--abbrev-ref', 'HEAD']);
        return ref === 'HEAD' ? undefined : ref;
      },
    ),
    gitAuthorName: firstDefined(
      process.env.GITHUB_ACTOR,
      process.env.GITLAB_USER_NAME,
      process.env.GIT_AUTHOR_NAME,
      () => tryGit(['log', '-1', '--pretty=format:%an']),
    ),
    gitHashCommitUrl,
  };
}
