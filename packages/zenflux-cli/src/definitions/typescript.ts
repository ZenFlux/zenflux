import type ts from "typescript";

import type { IZConfigInternal } from "@zenflux/cli/src/definitions/config";

type TZWorkerOptions = {
    id: string,
    config: IZConfigInternal;
    otherTSConfigs: ts.ParsedCommandLine[],
}

export type TZPreDiagnosticsOptions = {
    useCache?: boolean,
    haltOnError?: boolean,
}

export type TZPreDiagnosticsWorkerOptions = TZPreDiagnosticsOptions & TZWorkerOptions;

export type TZCreateDeclarationWorkerOptions = TZWorkerOptions;
