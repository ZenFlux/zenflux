/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
import path from "node:path";
import process from "node:process";

import util from "node:util";

import nodeResolve from "@rollup/plugin-node-resolve";

import { zGlobalPathsGet } from "@zenflux/cli/src/core/global";
import { zWorkspaceGetPackages } from "@zenflux/cli/src/core/workspace";

import zRollupCjsAsyncWrapPlugin
    from "@zenflux/cli/src/core/rollup-plugins/rollup-cjs-async-wrap/rollup-cjs-async-wrap-plugin";
import zRollupCustomLoaderPlugin
    from "@zenflux/cli/src/core/rollup-plugins/rollup-custom-loader/rollup-custom-loader-plugin";
import zRollupSwcPlugin from "@zenflux/cli/src/core/rollup-plugins/rollup-swc/rollup-swc-plugin";

import { zTSConfigRead } from "@zenflux/cli/src/core/typescript";

import packageJSON from "@zenflux/cli/package.json";

import { console } from "@zenflux/cli/src/modules/console";

import type { OutputOptions, OutputPlugin, Plugin, ResolveIdResult, RollupOptions } from "rollup";

import type { IOutputArgs, IPluginArgs } from "@zenflux/cli/src/definitions/rollup";
import type { TZConfigInternalArgs } from "@zenflux/cli/src/definitions/config";
import type { TZFormatType } from "@zenflux/cli/src/definitions/zenflux";

const DEFAULT_BASE_SRC_PATH = "/src";

export function zRollupPluginModuleResolve( args: Required<IPluginArgs> ): Plugin {
    const tsConfig = args.tsConfig!,
        projectPath = args.projectPath,
        baseSrcPath = tsConfig?.options.baseUrl ?? function useDefaultSrcPath () {
            const srcPath = path.join( projectPath, DEFAULT_BASE_SRC_PATH );

            console.verbose( () => `${ zRollupPluginModuleResolve.name }::${ useDefaultSrcPath.name }() -> ${ util.inspect( srcPath ) }` );

            return srcPath;
        }(),
        extensions = args.extensions;

    const workspacePackages = zWorkspaceGetPackages( "auto" );

    const relativeCache = new Map<string, string>(),
        workspaceCache = new Map<string, string>();

    function resolveRelative( modulePath: string ) {
        if ( relativeCache.has( modulePath ) ) {
            return relativeCache.get( modulePath );
        }

        const tryResolvePath = path.resolve( baseSrcPath, modulePath );

        // If resolved path has no extension
        if ( ! path.extname( tryResolvePath ) ) {
            // Try to resolve with each extension
            for ( const ext of extensions ) {
                const tryPath = tryResolvePath + ext;

                // Check if tryPath exist in args.tsConfig.fileNames
                if ( tsConfig.fileNames.includes( tryPath ) ) {
                    console.verbose( () => `${ zRollupPluginModuleResolve.name }::${ resolveRelative.name }() -> ${ util.inspect( tryPath ) }` );

                    relativeCache.set( modulePath, tryPath );

                    return tryPath;
                }
            }
        }
    }

    function resolveWorkspace( modulePath: string ) {
        if ( workspaceCache.has( modulePath ) ) {
            return workspaceCache.get( modulePath );
        }

        // Cross `modulePath` with `packages`
        const modulePathParts = modulePath.split( "/", 2 ),
            modulePathRest = modulePath.substring(
                modulePathParts[ 0 ].length + ( modulePathParts[ 1 ]?.length ?? 0 ) + 1,
                modulePath.length
            );

        for ( const [ packageName, packageObj ] of Object.entries( workspacePackages ) ) {
            if ( packageName === modulePathParts[ 0 ] || packageName === modulePathParts[ 0 ]  + "/" + modulePathParts[ 1 ] ) {
                const tryPath = path.join( packageObj.getPath(), modulePathRest );

                console.verbose( () => `${ resolveWorkspace.name }::${ resolveRelative.name }() -> ${ util.inspect( tryPath ) }` );

                const tryResolve = resolveRelative( tryPath );

                if ( tryResolve ) {
                    workspaceCache.set( modulePath, tryResolve );

                    return tryResolve;
                }
            }
        }
    }

    return {
        name: "z-rollup-plugin-resolve",
        resolveId( source ): ResolveIdResult {
            const isAbsolute = path.isAbsolute( source );

            // Try relative path
            if ( ! isAbsolute && source.startsWith( "." ) ) {
                const tryResolve = resolveRelative( source );

                if ( tryResolve ) {
                    return tryResolve;
                }
            }

            if ( ! isAbsolute ) {
                // Try workspace path
                const tryResolve = resolveWorkspace( source );

                if ( tryResolve ) {
                    return tryResolve;
                }

                return null;
            }
        },
    };
}

/**
 * Function zRollupGetPlugins(): This function returns an array of Rollup plugins based on the provided arguments.
 */
export const zRollupGetPlugins = ( args: IPluginArgs ): OutputPlugin[] => {
    // TODO: Should plugins be recreated for each format?
    const { extensions, format } = args;

    const requiredArgs = args as Required<IPluginArgs>;

    if ( "undefined" ===  typeof args.tsConfig ) {
        requiredArgs.tsConfig = zTSConfigRead( format as TZFormatType, args.projectPath );
    }

    const plugins: Plugin[] = [];

    plugins.push( zRollupPluginModuleResolve( requiredArgs ) );

    const nodeResolvePlugin = nodeResolve( {
        extensions: extensions,
        preferBuiltins: true,
        modulePaths: [ zGlobalPathsGet().workspace + "/node_modules/" ],
    } );

    nodeResolvePlugin.onLog = ( logLevel, message ) => {
        console.log( `nodeResolvePlugin: ${ util.inspect( {
            ... message,
            projectPath: args.projectPath,
        } ) }` );
    };

    plugins.push( nodeResolvePlugin );

    plugins.push( zRollupSwcPlugin( requiredArgs ) );

    plugins.push( zRollupCustomLoaderPlugin( requiredArgs ) );

    if ( "cjs" === format ) {
        // Depends on `transpiler` plugin
        plugins.push( zRollupCjsAsyncWrapPlugin( requiredArgs ) );
    }

    return plugins;
};

/**
 * Function zRollupGetOutput(): Generates an OutputOptions object based on the provided arguments.
 * It configures the output format, file path, and other options for the Rollup output.
 */
export const zRollupGetOutput = ( args: IOutputArgs, projectPath: string ): OutputOptions => {
    const {
        format,
        outputName,
        outputFileName
    } = args;

    const tsConfig = zTSConfigRead( format as TZFormatType, projectPath );

    const outDir = `${ tsConfig.options.outDir || projectPath + "/dist" }`;

    const result: OutputOptions = {
        // TODO: Should be configurable, eg: `{tsConfigOutDir}/{outputFileName}.{format}.{ext}`
        // file: `${ outDir }/${ outputFileName }.${ format }.${ ext }`,

        dir: outDir,
        entryFileNames: `${ outputFileName }.${ format }`,
        chunkFileNames: `${ outputFileName }-[name].${ format }`,

        sourcemap: tsConfig.options.sourceMap,

        format,

        indent: false,
        exports: "named",

        banner: "" +
            "/**\n" +
            ` * Bundled with love using the help of ${ packageJSON.name } toolkit v${ packageJSON.version }\n` +
            ` * Bundle name: ${ outputName } fileName: ${ outputFileName }, built at ${ new Date() }\n` +
            " */\n",

    };

    if ( outputName ) {
        result.name = outputName;
    }

    return result;
};

/**
 * Function zRollupGetConfig(): This function generates a Rollup configuration object based on the provided arguments.
 * It assembles the input, output, and plugin configurations for Rollup.
 */
export const zRollupGetConfig = ( args: TZConfigInternalArgs, projectPath: string ): RollupOptions => {
    const {
        extensions,
        external,
        format,
        inputPath,
        outputFileName,
        outputName,
    } = args;

    const result: RollupOptions = {
        input: path.isAbsolute( inputPath ) ? inputPath : path.resolve( projectPath, inputPath ),
        external,
    };

    const outputArgs: IOutputArgs = {
        format,
        outputName,
        outputFileName
    };

    if ( outputName ) {
        outputArgs.outputName = outputName;
    }

    result.output = zRollupGetOutput( outputArgs, projectPath );

    const pluginsArgs: IPluginArgs = {
        extensions: extensions,
        format: format,
        moduleForwarding: args.moduleForwarding,
        sourcemap: !! result.output.sourcemap,
        minify: "development" !== process.env.NODE_ENV,
        projectPath: projectPath,
    };

    result.plugins = zRollupGetPlugins( pluginsArgs );

    return result;
};
