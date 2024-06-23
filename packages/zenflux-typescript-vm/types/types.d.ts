import Module, { ImportAttributes } from "node:module";

import { Script } from "vm";
import type { ModuleLinker, SourceTextModule, SourceTextModuleOptions, SyntheticModule } from "node:vm";
import type { ProviderBase } from "../src/providers/base/provider-base";

declare global {
    type zVmModuleType = "node" | "esm" | "json";

    type zVmModuleSource = Module | string | any;

    type zVmModule = SyntheticModule | SourceTextModule;

    interface zVmModuleLocalTextSourceOptions {
        referencingModule: Module;
        moduleImportMeta?: ReturnType<SourceTextModuleOptions["initializeImportMeta"]>;
        moduleImportDynamically?: ( ( specifier: string, script: Script, importAttributes: ImportAttributes ) => Module );
        moduleLinkerCallback?: ModuleLinker | null;
    }

    interface zVmModuleEvaluateOptions {
        moduleType?: zVmModuleType
        moduleLocalTextSourceOptions?: zVmModuleLocalTextSourceOptions
    }

    interface zVmResolverRequest {
        provider: ProviderBase;
        modulePath: string;
        resolvedPath?: string;
        referencingModule: Module;
    }

    function zVmResolverMiddlewareCallback( request: zVmResolverRequest ): void;
}
