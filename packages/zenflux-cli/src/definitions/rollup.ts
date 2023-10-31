/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
import type { GlobalsOption, ModuleFormat } from "rollup";

export type TZBabelHelperType = "bundled" | "runtime" | "inline" | "external"

export interface IPluginArgs {
    babelExcludeNodeModules?: boolean;
    babelHelper?: TZBabelHelperType;
    babelUseESModules?: boolean;
    extensions: string[],
    format: ModuleFormat;
    minify: boolean;
}

export interface IOutputArgs {
    ext?: string;
    format: ModuleFormat;
    globals?: GlobalsOption;
    outputFileName: string;
    outputName: string,
}

