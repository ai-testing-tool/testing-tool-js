export type CiMetadata = {
  ciPlatform?: string;
  buildUrl?: string;
  gitCommitSha?: string;
  gitBranch?: string;
  gitAuthorName?: string;
  gitAuthorEmail?: string;
};

function firstDefined(...values: Array<string | undefined>): string | undefined {
  return values.find((value) => value !== undefined && value !== '');
}

/** Best-effort CI metadata from common provider env vars. */
export function detectCiEnvironment(): CiMetadata {
  const github = process.env.GITHUB_ACTIONS === 'true';
  const gitlab = Boolean(process.env.GITLAB_CI);
  const azure = Boolean(process.env.TF_BUILD);
  const bitbucket = Boolean(process.env.BITBUCKET_BUILD_NUMBER);
  const teamcity = Boolean(process.env.TEAMCITY_VERSION);
  const jenkins = Boolean(process.env.JENKINS_URL);

  let ciPlatform: string | undefined;
  let buildUrl: string | undefined;

  if (github) {
    ciPlatform = 'github';
    const server = process.env.GITHUB_SERVER_URL ?? 'https://github.com';
    const repo = process.env.GITHUB_REPOSITORY;
    const runId = process.env.GITHUB_RUN_ID;
    if (repo && runId) {
      buildUrl = `${server}/${repo}/actions/runs/${runId}`;
    }
  } else if (gitlab) {
    ciPlatform = 'gitlab';
    buildUrl = process.env.CI_PIPELINE_URL;
  } else if (azure) {
    ciPlatform = 'azure-devops';
    const collection = process.env.SYSTEM_TEAMFOUNDATIONCOLLECTIONURI;
    const project = process.env.SYSTEM_TEAMPROJECT;
    const buildId = process.env.BUILD_BUILDID;
    if (collection && project && buildId) {
      buildUrl = `${collection}${project}/_build/results?buildId=${buildId}`;
    }
  } else if (bitbucket) {
    ciPlatform = 'bitbucket';
    buildUrl = process.env.BITBUCKET_GIT_HTTP_ORIGIN;
  } else if (teamcity) {
    ciPlatform = 'teamcity';
    buildUrl = process.env.BUILD_URL;
  } else if (jenkins) {
    ciPlatform = 'jenkins';
    buildUrl = process.env.BUILD_URL;
  }

  return {
    ciPlatform,
    buildUrl,
    gitCommitSha: firstDefined(
      process.env.GITHUB_SHA,
      process.env.CI_COMMIT_SHA,
      process.env.BUILD_SOURCEVERSION,
      process.env.BITBUCKET_COMMIT,
    ),
    gitBranch: firstDefined(
      process.env.GITHUB_REF_NAME,
      process.env.CI_COMMIT_REF_NAME,
      process.env.BUILD_SOURCEBRANCHNAME,
      process.env.BITBUCKET_BRANCH,
    ),
    gitAuthorName: firstDefined(process.env.GITHUB_ACTOR, process.env.GITLAB_USER_NAME),
    gitAuthorEmail: process.env.GITLAB_USER_EMAIL,
  };
}
