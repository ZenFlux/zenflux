import type ts from "typescript";
import type { IZConfigInternal } from ".//src/definitions/config";
type TZWorkerOptions = {
    id: string;
    config: IZConfigInternal;
    otherTSConfigs: ts.ParsedCommandLine[];
};
export type TZPreDiagnosticsOptions = {
    useCache?: boolean;
    haltOnError?: boolean;
    /**
     * Run diagnostics through the TypeScript 7 native backend instead of the TypeScript 5 compiler API.
     *
     * @see `@zenflux/cli/src/core/typescript-ts7`
     */
    useBetaTS7?: boolean;
};
export type TZPreDiagnosticsWorkerOptions = TZPreDiagnosticsOptions & TZWorkerOptions;
export type TZCreateDeclarationWorkerOptions = TZWorkerOptions;
/**
 * A TypeScript 7 diagnostic.
 *
 * Unlike `ts.Diagnostic` this is a flat, JSON serializable record, it carries a file *name* and character
 * offsets rather than a live `SourceFile` handle. `line` / `character` are resolved by zenflux.
 */
export type TZTS7Diagnostic = {
    fileName?: string;
    pos: number;
    end: number;
    code: number;
    category: number;
    text: string;
    messageChain?: readonly TZTS7Diagnostic[];
    relatedInformation?: readonly TZTS7Diagnostic[];
    line?: number;
    character?: number;
};
export interface IZTS7Program {
    getConfigFileParsingDiagnostics(): readonly TZTS7Diagnostic[];
    getProgramDiagnostics(): readonly TZTS7Diagnostic[];
    getSyntacticDiagnostics(): readonly TZTS7Diagnostic[];
    getGlobalDiagnostics(): readonly TZTS7Diagnostic[];
    getSemanticDiagnostics(): readonly TZTS7Diagnostic[];
}
export interface IZTS7Project {
    readonly configFileName: string;
    readonly program: IZTS7Program;
}
export interface IZTS7Snapshot {
    getProject(configFileName: string): IZTS7Project | undefined;
    getProjects(): readonly IZTS7Project[];
    dispose(): void;
}
export interface IZTS7ApiInstance {
    updateSnapshot(params: {
        openProjects: string[];
    }): IZTS7Snapshot;
    close(): void;
}
/**
 * The subset of `typescript/unstable/sync` that zenflux relies on.
 *
 * Declared structurally rather than imported, the package is an optional peer that is only present when
 * `useBetaTS7` is in play.
 */
export type TZTS7Api = {
    API: new (options?: {
        cwd?: string;
    }) => IZTS7ApiInstance;
    zVersion?: string;
};
export type TZTS7ProjectConfig = {
    fileName: string;
    dispose: () => void;
};
export {};
//# sourceMappingURL=typescript.d.ts.map