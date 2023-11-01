/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
import path from "node:path";
import process from "node:process";

import ts from "typescript";

import nodeResolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import babel from "@rollup/plugin-babel";
import json from "@rollup/plugin-json";
import terser from "@rollup/plugin-terser";

import { zTSConfigRead } from "@z-cli/core/tsconfig";

import packageJSON from "@z-cli/../package.json";

import type { OutputOptions, OutputPlugin, RollupOptions } from "rollup";
import type { RollupBabelInputPluginOptions } from "@rollup/plugin-babel";
import type { RollupTypescriptOptions } from "@rollup/plugin-typescript";

import type { IOutputArgs, IPluginArgs } from "@z-cli/definitions/rollup";
import type { IConfigArgs } from "@z-cli/definitions/config";
import type { TZFormatType } from "@z-cli/definitions/zenflux";

const gBabelRuntimeVersion = packageJSON.dependencies[ "@babel/runtime" ].replace( /^[^0-9]*/, "" );

/**
 * This function returns an array of Rollup plugins based on the provided arguments.
 * It configures and adds plugins for resolving dependencies, TypeScript, Babel, JSON, and optionally Terser for minification.
 */
export const zRollupGetPlugins = ( args: IPluginArgs, projectPath: string ): OutputPlugin[] => {
    const { extensions, format } = args;

    const plugins = [
        nodeResolve( { extensions } ),
    ];

    const rand = Math.random();

    const rollupTypescriptOptions: RollupTypescriptOptions = {
        compilerOptions: {
            [ rand.toString() ]: true,
        },

        // Override `ts.parseJsonConfigFileContent` to avoid loading of tsconfig multiple times, since there are no way to pass custom object to the plugin.
        typescript: Object.assign( {}, ts, {
            parseJsonConfigFileContent: ( ... args: any ) => {
                if ( args[ 0 ]?.compilerOptions?.[ rand.toString() ] ) {
                    return zTSConfigRead( format as TZFormatType, projectPath );
                }

                return ts.parseJsonConfigFileContent.apply( ts, args );
            }
        } ),
    };

    plugins.push( typescript( rollupTypescriptOptions ) );

    const babelConfig: RollupBabelInputPluginOptions = {
        extensions,
        plugins: [],
        babelHelpers: args.babelHelper,
        configFile: projectPath + "/.babelrc",
    };

    if ( args.babelExcludeNodeModules ) {
        babelConfig.exclude = "node_modules/**";
    }

    if ( args.babelUseESModules ) {
        babelConfig.plugins?.push( [ "@babel/plugin-transform-runtime", {
            version: gBabelRuntimeVersion,
            useESModules: true,
        } ] );
    } else {
        babelConfig.plugins?.push( [ "@babel/plugin-transform-runtime", { version: gBabelRuntimeVersion } ] );
    }

    if ( "bundled" === args.babelHelper ) {
        babelConfig.skipPreflightCheck = true;
    }

    plugins.push( json() );
    plugins.push( babel( babelConfig ) );

    if ( args.minify ) {
        plugins.push( terser( {
            compress: {
                pure_getters: true,
                unsafe: true,
                unsafe_comps: true
            }
        } ) );
    }

    return plugins;
};

/**
 * This function generates an OutputOptions object based on the provided arguments.
 * It configures the output format, file path, and other options for the Rollup output.
 */
export const zRollupGetOutput = ( args: IOutputArgs, projectPath: string ): OutputOptions => {
    const {
        ext = "js",
        format,
        globals,
        outputName,
        outputFileName
    } = args;

    const tsConfig = zTSConfigRead( format as TZFormatType, projectPath );

    const result = {
        // TODO: Should be configurable, eg: `{tsOutDir}/{outputFileName}.{format}.{ext}`
        file: `${ tsConfig.options.outDir || "dist" }/${ outputFileName }.${ format }.${ ext }`,

        sourcemap: tsConfig.options.sourceMap,

        format,

        indent: false,
        exports: "named",
    } as OutputOptions;

    if ( globals ) {
        result.globals = globals;
    }

    if ( outputName ) {
        result.name = outputName;
    }

    return result;
};

/**
 * This function generates a Rollup configuration object based on the provided arguments.
 * It assembles the input, output, and plugin configurations for Rollup.
 */
export const zRollupGetConfig = ( args: IConfigArgs, projectPath: string ): RollupOptions => {
    const {
        extensions,
        external = [],
        format,
        globals,
        inputPath,
        outputFileName,
        outputName,
    } = args;

    const result: RollupOptions = {
        input: path.isAbsolute( inputPath ) ? inputPath : path.resolve( projectPath, inputPath ),
        external,
    };

    const outputArgs = {
        format,
        globals,
        outputFileName,
    } as IOutputArgs;

    // if ( "esm" === format ) {
    //     outputArgs.ext = "mjs";
    // }

    if ( outputName ) {
        outputArgs.outputName = outputName;
    }

    result.output = zRollupGetOutput( outputArgs, projectPath );

    const pluginsArgs: IPluginArgs = {
        extensions,
        format,
        minify: "development" !== process.env.NODE_ENV,
    };

    // noinspection FallThroughInSwitchStatementJS
    switch ( format ) {
        case "es":
            pluginsArgs.babelUseESModules = true;
        case "cjs":
            pluginsArgs.babelHelper = "runtime";
            break;

        case "umd":
            pluginsArgs.babelExcludeNodeModules = true;
        // case "esm": // TODO: Figure out why this is needed for ESM.
            pluginsArgs.babelHelper = "bundled";
            break;

        default: {
            throw new Error( `Unknown format: ${ format }` );
        }
    }

    result.plugins = zRollupGetPlugins( pluginsArgs, projectPath );

    return result;
};
