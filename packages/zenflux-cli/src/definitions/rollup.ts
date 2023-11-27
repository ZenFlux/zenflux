/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
import type ts from "typescript";

import type { GlobalsOption, ModuleFormat } from "rollup";

export type TZBabelHelperType = "bundled" | "runtime" | "inline" | "external"

export interface IPluginArgs {
    tsConfig?: ts.ParsedCommandLine;
    babelExcludeNodeModules?: boolean;
    babelHelper?: TZBabelHelperType;
    babelUseESModules?: boolean;
    extensions: string[],
    format: ModuleFormat;
    minify: boolean;
    moduleForwarding?: { [ key: string ]: { [ key: string ]: string } };
    sourcemap: boolean;
}

export interface IOutputArgs {
    ext?: string;
    format: ModuleFormat;
    globals?: GlobalsOption;
    outputFileName: string;
    outputName: string,
}

