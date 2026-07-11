import type { CiTemplateContext, CiTemplatePartial, CiTemplateResult, CiTemplateVariant } from './types';
export declare function listCiTemplateVariants(): CiTemplateVariant[];
/**
 * Generate a CI YAML (or equivalent) snippet for the given context.
 * Accepts a partial context — fills platform defaults via buildCiTemplateContext.
 */
export declare function generateCiTemplate(input: CiTemplateContext | CiTemplatePartial): CiTemplateResult;
