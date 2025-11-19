/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
import path from "node:path";
import process from "node:process";
import util from "node:util";

import nodeResolve from "@rollup/plugin-node-resolve";
import nodeCommonJsToEsm from "@rollup/plugin-commonjs";

import { ConsoleManager }  from "@zenflux/cli/src/managers/console-manager";

import { zGlobalPathsGet } from "@zenflux/cli/src/core/global";
import { zWorkspaceGetPackages } from "@zenflux/cli/src/core/workspace";

import zRollupCjsAsyncWrapPlugin
    from "@zenflux/cli/src/core/rollup-plugins/rollup-cjs-async-wrap/rollup-cjs-async-wrap-plugin";
import zRollupCustomLoaderPlugin
    from "@zenflux/cli/src/core/rollup-plugins/rollup-custom-loader/rollup-custom-loader-plugin";
import zRollupSwcPlugin from "@zenflux/cli/src/core/rollup-plugins/rollup-swc/rollup-swc-plugin";

import { zTSConfigRead } from "@zenflux/cli/src/core/typescript";

import packageJSON from "@zenflux/cli/package.json";

import type { OutputOptions, OutputPlugin, Plugin, ResolveIdResult, RollupOptions } from "rollup";

import type { IOutputArgs, IPluginArgs } from "@zenflux/cli/src/definitions/rollup";
import type { TZConfigInternalArgs } from "@zenflux/cli/src/definitions/config";
import type { TZFormatType } from "@zenflux/cli/src/definitions/zenflux";

const DEFAULT_BASE_SRC_PATH = "/src";

export async function zRollupPluginModuleResolve( args: Required<IPluginArgs> ): Promise<Plugin> {
    const tsConfig = args.tsConfig!,
        projectPath = args.projectPath,
        baseSrcPath = tsConfig?.options.baseUrl ?? function useDefaultSrcPath () {
            const srcPath = path.join( projectPath, DEFAULT_BASE_SRC_PATH );

            ConsoleManager.$.debug(
                () => [ "path-resolve", useDefaultSrcPath.name, util.inspect( srcPath ) ]
            );

            return srcPath;
        }(),
        extensions = args.extensions;

    const workspacePackages = await zWorkspaceGetPackages( "auto" );

    const relativeCache = new Map<string, string>(),
        workspaceCache = new Map<string, string>(),
        absoluteCache = new Map<string, string>();

    function resolveExt( tryResolvePath: string ) {
        // If resolved path has no extension
        if ( ! path.extname( tryResolvePath ) ) {
            // Try to resolve with each extension
            for ( const ext of extensions ) {
                const tryPath = tryResolvePath + ext;

                // Check if tryPath exist in args.tsConfig.fileNames
                if ( tsConfig.fileNames.includes( tryPath ) ) {
                    return tryPath;
                }
            }
        }

        return null;
    }

    function resolveRelative( modulePath: string ) {
        if ( relativeCache.has( modulePath ) ) {
            return relativeCache.get( modulePath );
        }

        if ( tsConfig.fileNames.includes( modulePath ) ) {
            return modulePath;
        }

        const tryResolvePath = path.resolve( baseSrcPath, modulePath );

        return resolveExt( tryResolvePath );
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

                ConsoleManager.$.debug(
                    () => [ "path-resolve" , resolveRelative.name,  util.inspect( tryPath ) ]
                );

                const tryResolve = resolveExt( tryPath );

                if ( tryResolve ) {
                    workspaceCache.set( modulePath, tryResolve );

                    return tryResolve;
                }
            }
        }
    }

    function resolveAbsolute( modulePath: string ) {
        if ( absoluteCache.has( modulePath ) ) {
            return absoluteCache.get( modulePath );
        }

        // Check if modulePath exist in args.tsConfig.fileNames
        if ( tsConfig.fileNames.includes( modulePath ) ) {
            return modulePath;
        }

        return resolveExt( modulePath );
    }

    return {
        name: "z-rollup-plugin-resolve",

        resolveId( source ): ResolveIdResult {
            const isAbsolute = path.isAbsolute( source );

            // Try relative path
            if ( ! isAbsolute && source.startsWith( "." ) ) {
                const tryResolve = resolveRelative( source );

                if ( tryResolve ) {
                    ConsoleManager.$.debug(
                        () => [ "path-resolve", resolveRelative.name,  util.inspect( tryResolve ) ]
                    );

                    return {
                        id: tryResolve,
                        external: false,
                        resolvedBy: zRollupPluginModuleResolve.name,
                    };
                }
            }

            if ( ! isAbsolute ) {
                // Try workspace path
                const tryResolve = resolveWorkspace( source );

                if ( tryResolve ) {
                    ConsoleManager.$.debug(
                        () => [ "path-resolve", resolveWorkspace.name,  util.inspect( tryResolve ) ]
                    );

                    return {
                        id: tryResolve,
                        external: false,
                        resolvedBy: zRollupPluginModuleResolve.name,
                    };
                }
            }

            if ( isAbsolute ) {
                // Try absolute path
                const tryResolve = resolveAbsolute( source );

                if ( tryResolve ) {
                    ConsoleManager.$.debug(
                        () => [ "path-resolve", resolveAbsolute.name,  util.inspect( tryResolve ) ]
                    );

                    return {
                        id: tryResolve,
                        external: false,
                        resolvedBy: zRollupPluginModuleResolve.name,
                    };
                }
            }
        },
    };
}

/**
 * Function zRollupGetPlugins(): This function returns an array of Rollup plugins based on the provided arguments.
 */
export const zRollupGetPlugins = async ( args: IPluginArgs ): Promise<OutputPlugin[]> => {
    // TODO: Should plugins be recreated for each format?
    const { extensions, format } = args;

    const requiredArgs = args as Required<IPluginArgs>;

    if ( "undefined" ===  typeof args.tsConfig ) {
        requiredArgs.tsConfig = zTSConfigRead( format as TZFormatType, args.projectPath );
    }

    const plugins: Plugin[] = [];

    plugins.push( await zRollupPluginModuleResolve( requiredArgs ) );

    const nodeResolvePlugin = nodeResolve( {
        extensions: extensions,
        preferBuiltins: true,
        modulePaths: [ zGlobalPathsGet().workspace + "/node_modules/" ],
    } );

    plugins.push( nodeResolvePlugin );

    plugins.push( nodeCommonJsToEsm( {} ) );

    plugins.push( zRollupSwcPlugin( requiredArgs ) );

    if ( args.enableCustomLoader ) {
        plugins.push( zRollupCustomLoaderPlugin( requiredArgs ) );
    }

    if ( args.enableCjsAsyncWrap ) {
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

    let outputExt = "js";
    switch ( format ) {
        case "cjs":
            outputExt = "cjs";
            break;
        case "es":
            outputExt = "mjs";
            break;
    }

    const result: OutputOptions = {
        // TODO: Should be configurable, eg: `{tsConfigOutDir}/{outputFileName}.{format}.{ext}`
        // file: `${ outDir }/${ outputFileName }.${ format }.${ ext }`,

        dir: outDir,
        entryFileNames: `${ outputFileName }.${ outputExt }`,
        chunkFileNames: `${ outputFileName }-[name].${ outputExt }`,

        sourcemap: tsConfig.options.sourceMap,

        format,

        indent: false,
        exports: "named",

        banner: "" +
            "/**\n" +
            ` * Bundled with love using the help of ${ packageJSON.name } toolkit v${ packageJSON.version }\n` +
            ` * Bundle name: ${ outputName } fileName: '${ outputFileName }', built at ${ new Date() }\n` +
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
export const zRollupGetConfig = async ( args: TZConfigInternalArgs, projectPath: string ): Promise<RollupOptions> => {
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

        // Rollup is not trushworthy enough to do treeshaking, assuming swc will do it better
        treeshake: false,
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
        enableCustomLoader: !! args.enableCustomLoader,
        enableCjsAsyncWrap: !! args.enableCjsAsyncWrap,
    };

    result.plugins = await zRollupGetPlugins( pluginsArgs );

    return result;
};
