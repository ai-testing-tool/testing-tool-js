import type { CiTemplateContext, CiTemplatePartial } from './types';
/**
 * Fills platform-specific expression defaults (proposal §3.2).
 * Does not embed token values — only secret *names* and expressions.
 */
export declare function buildCiTemplateContext(partial: CiTemplatePartial): CiTemplateContext;
