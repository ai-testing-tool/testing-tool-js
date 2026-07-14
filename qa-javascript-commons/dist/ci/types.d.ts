export type CiPlatform = 'github' | 'gitlab' | 'azure-devops' | 'jenkins' | 'bitbucket';
export type CiFramework = 'vitest' | 'jest' | 'mocha' | 'cucumberjs' | 'cypress' | 'playwright' | 'wdio';
export type CiIngestPath = 'upload' | 'reporter';
export interface CiTemplateContext {
    platform: CiPlatform;
    framework: CiFramework;
    ingestPath: CiIngestPath;
    /** Pre-filled from Forge site config / user selection */
    projectKey: string;
    /** From site_config — never inlined as a token; YAML uses secret placeholders */
    ingestUrl?: string;
    ingestUrlSecret: string;
    ingestTokenSecret: string;
    nodeVersion?: string;
    reportFile?: string;
    /** Platform-specific expression for --project (may use vars.* or literal) */
    projectKeyExpr?: string;
    launchNameExpr?: string;
    /** Platform expression for QANALYZER_INGEST_URL env value */
    ingestUrlExpr?: string;
    /** Platform expression for QANALYZER_INGEST_TOKEN env value */
    ingestTokenExpr?: string;
    /** Platform “always run” guard (e.g. if: always()) */
    alwaysGuard?: string;
    includeTestStep?: boolean;
    includeUploadStep?: boolean;
}
export interface CiSecretHint {
    name: string;
    description: string;
    platformHint: string;
}
export interface CiVariableHint {
    name: string;
    description: string;
    platformHint: string;
}
export interface CiTemplateResult {
    platform: CiPlatform;
    framework: CiFramework;
    ingestPath: CiIngestPath;
    filename: string;
    content: string;
    secretsSetup: CiSecretHint[];
    variablesSetup: CiVariableHint[];
}
export interface CiTemplateVariant {
    platform: CiPlatform;
    framework: CiFramework;
    ingestPath: CiIngestPath;
}
export type CiTemplatePartial = Partial<CiTemplateContext> & Pick<CiTemplateContext, 'platform' | 'framework' | 'ingestPath' | 'projectKey'>;
export declare class UnsupportedVariantError extends Error {
    readonly platform: CiPlatform;
    readonly framework: CiFramework;
    readonly ingestPath: CiIngestPath;
    constructor(platform: CiPlatform, framework: CiFramework, ingestPath: CiIngestPath);
}
