import { buildCiTemplateContext } from './context';
import { renderAzureDevOpsUpload } from './templates/azure-devops';
import { renderBitbucketUpload } from './templates/bitbucket';
import { renderGithubUpload } from './templates/github';
import { renderGitlabUpload } from './templates/gitlab';
import { renderJenkinsUpload } from './templates/jenkins';
import type {
  CiFramework,
  CiPlatform,
  CiTemplateContext,
  CiTemplatePartial,
  CiTemplateResult,
  CiTemplateVariant,
} from './types';
import { UnsupportedVariantError } from './types';

const PLATFORMS: CiPlatform[] = [
  'github',
  'gitlab',
  'azure-devops',
  'jenkins',
  'bitbucket',
];

const UPLOAD_FRAMEWORKS: CiFramework[] = ['vitest', 'jest', 'playwright'];
const REPORTER_FRAMEWORKS: CiFramework[] = [
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
const SUPPORTED_VARIANTS: CiTemplateVariant[] = [
  ...PLATFORMS.flatMap((platform) =>
    UPLOAD_FRAMEWORKS.map((framework) => ({
      platform,
      framework,
      ingestPath: 'upload' as const,
    })),
  ),
  ...PLATFORMS.flatMap((platform) =>
    REPORTER_FRAMEWORKS.map((framework) => ({
      platform,
      framework,
      ingestPath: 'reporter' as const,
    })),
  ),
];

function isSupported(ctx: Pick<CiTemplateContext, 'platform' | 'framework' | 'ingestPath'>): boolean {
  return SUPPORTED_VARIANTS.some(
    (v) =>
      v.platform === ctx.platform &&
      v.framework === ctx.framework &&
      v.ingestPath === ctx.ingestPath,
  );
}

export function listCiTemplateVariants(): CiTemplateVariant[] {
  return [...SUPPORTED_VARIANTS];
}

/**
 * Generate a CI YAML (or equivalent) snippet for the given context.
 * Accepts a partial context — fills platform defaults via buildCiTemplateContext.
 */
export function generateCiTemplate(
  input: CiTemplateContext | CiTemplatePartial,
): CiTemplateResult {
  const ctx = buildCiTemplateContext(input);

  if (!isSupported(ctx)) {
    throw new UnsupportedVariantError(ctx.platform, ctx.framework, ctx.ingestPath);
  }

  switch (ctx.platform) {
    case 'github':
      return renderGithubUpload(ctx);
    case 'gitlab':
      return renderGitlabUpload(ctx);
    case 'azure-devops':
      return renderAzureDevOpsUpload(ctx);
    case 'jenkins':
      return renderJenkinsUpload(ctx);
    case 'bitbucket':
      return renderBitbucketUpload(ctx);
    default: {
      const _exhaustive: never = ctx.platform;
      throw new UnsupportedVariantError(_exhaustive, ctx.framework, ctx.ingestPath);
    }
  }
}
