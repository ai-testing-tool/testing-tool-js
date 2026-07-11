import type { CiTemplateContext } from '../types';
/**
 * Shared upload invocation — matches ci-upload-helper.md.
 * Callers supply platform-quoted project/launch expressions.
 */
export declare function uploadCliCommand(ctx: CiTemplateContext): string;
/** Indent every line of the shared upload CLI (for YAML `|` / Groovy blocks). */
export declare function indentUploadCli(ctx: CiTemplateContext, spaces: number): string;
export declare function frameworkTestCommand(ctx: CiTemplateContext): string;
export declare function frameworkLabel(ctx: CiTemplateContext): string;
