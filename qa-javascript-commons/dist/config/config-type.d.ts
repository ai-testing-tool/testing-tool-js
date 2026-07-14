import type { ModeEnum } from '../options';
export type IngestOptionsType = {
    url?: string;
    token?: string;
    timeoutMs?: number;
    maxPayloadBytes?: number;
};
export type FileOptionsType = {
    path?: string;
};
export type ConfigType = {
    mode?: `${ModeEnum}`;
    fallback?: `${ModeEnum}`;
    projectKey?: string;
    launchName?: string;
    planId?: string;
    planKey?: string;
    planName?: string;
    fixVersion?: string;
    sprintName?: string;
    debug?: boolean;
    ingest?: IngestOptionsType;
    file?: FileOptionsType;
};
