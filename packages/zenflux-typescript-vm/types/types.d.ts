import type Module from "node:module";

import type { ModuleLinker, SourceTextModule, SourceTextModuleOptions, SyntheticModule } from "node:vm";
import type { ProviderBase } from "../src/providers/base/provider-base";

declare global {
    type zVmModuleType = "node" | "esm" | "json";

    type zVmModuleSource = Module | string | any;

    type zVmModule = SyntheticModule | SourceTextModule;

    interface zVmModuleLocalTextSourceOptions {
        referencingModule: Module;refererUrl
        moduleImportMeta?: ReturnType<SourceTextModuleOptions["initializeImportMeta"]>
        moduleImportDynamically?: ReturnType<SourceTextModuleOptions["importModuleDynamically"]>
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
