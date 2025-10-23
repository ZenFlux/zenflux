/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
import type ts from "typescript";
import type { InternalModuleFormat } from "rollup";
export interface IPluginArgs {
    tsConfig?: ts.ParsedCommandLine;
    extensions?: string[];
    projectPath: string;
    format: InternalModuleFormat;
    minify: boolean;
    moduleForwarding?: {
        [key: string]: {
            [key: string]: string;
        };
    };
    enableCustomLoader: boolean;
    enableCjsAsyncWrap: boolean;
    sourcemap: boolean;
}
export interface IOutputArgs {
    format: InternalModuleFormat;
    outputFileName: string;
    outputName: string;
}
//# sourceMappingURL=rollup.d.ts.map