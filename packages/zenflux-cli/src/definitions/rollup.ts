/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
import type ts from "typescript";

import type { ModuleFormat } from "rollup";

export interface IPluginArgs {
    tsConfig?: ts.ParsedCommandLine;
    extensions?: string[],
    projectPath: string;
    format: ModuleFormat;
    minify: boolean;
    moduleForwarding?: { [ key: string ]: { [ key: string ]: string } };
    sourcemap: boolean;
}

export interface IOutputArgs {
    format: ModuleFormat;
    outputFileName: string;
    outputName: string,
}

