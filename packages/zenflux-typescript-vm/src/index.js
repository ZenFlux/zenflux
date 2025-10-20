/**
 * @author Leonid Vinikov <leonidvinikov@gmail.com>
 *
 * @description The following include "ugly" code, since jsdoc has to work both with intellij and vscode intellisense.
 * Facing top level await in esm modules, and other issues, in order to achieve doc definitions, and dynamic `defineConfig()`
 * that can be placed everywhere.
 */
import fs from "node:fs";
import util from "node:util";
import path from "node:path";

import { createContext, measureMemory } from "node:vm";

import { zGetAbsoluteOrRelativePath } from "@zenflux/utils/path";
import { zCreateResolvablePromise } from "@zenflux/utils/promise";

import { defineConfig, externalConfig, waitForConfig } from "./config.js";
import { verbose } from "./utils.js";

export { Resolvers } from "./resolvers.js";
export { Loaders } from "./loaders.js";

const isBun = typeof process.versions.bun !== "undefined";

if ( ! isBun ) {
    if ( ! process.execArgv.includes( '--experimental-vm-modules' ) ) {
        throw new Error( "Please enable '--experimental-vm-modules' flag" );
    }

    if ( ! process.execArgv.includes( '--experimental-import-meta-resolve' ) ) {
        throw new Error( "Please enable '--experimental-import-meta-resolve' flag" );
    }
}

util.inspect.defaultOptions.colors = true;
util.inspect.defaultOptions.breakLength = 1;

const initializePromise = zCreateResolvablePromise();

const initialize = async () => {
    // Wait for config to be defined.
    await waitForConfig();

    const paths = {
        project: zGetAbsoluteOrRelativePath( externalConfig.projectPath ),

        workspacePath: null,

        nodeModules: zGetAbsoluteOrRelativePath( externalConfig.nodeModulesPath, externalConfig.projectPath ),

        tsConfigPath: zGetAbsoluteOrRelativePath( externalConfig.tsConfigPath, externalConfig.projectPath ),
    };

    if ( externalConfig.workspacePath ) {
        paths.workspacePath = zGetAbsoluteOrRelativePath( externalConfig.workspacePath, externalConfig.projectPath );
    }

    // Check all paths exists.
    Object.entries( paths ).forEach( ( [ key, value ] ) => {
        if ( null === value ) {
            return;
        }
        if ( ! fs.existsSync( value ) ) {
            throw new Error( `Path of: '${ key }' not exist '${ value }'` );
        }
    } );

    /**
     * @name zVm.config
     */
    const config = {
        paths,

        extensions: externalConfig.extensions,

        vmModuleEvaluateOptions: externalConfig.vmModuleEvaluateOptions,
    };

    // TODO: Find better solution.
    /**
     * @type {import("typescript").ParsedCommandLine}
     */
    let tsConfig;
    let tsNodeProvider, swcProvider;

    if ( externalConfig.useTsNode ) {
        tsNodeProvider =
            new ( ( await import( "./providers/ts-node-provider.js" ) ).TsNodeProvider )( {
                skipInitialize: true,

                tsConfigPath: config.paths.tsConfigPath,
                tsConfigReadCallback: externalConfig.tsConfigVerbose
            } );

        tsNodeProvider.initialize();

        tsConfig = tsNodeProvider.service.config;
    } else if ( externalConfig.useSwc ) {
        swcProvider =
            new ( ( await import( "./providers/swc-provider.js" ) ).SwcProvider )( {
                tsConfigPath: config.paths.tsConfigPath,
                tsConfigReadCallback: externalConfig.tsConfigVerbose
            } );

        swcProvider.initialize();

        tsConfig = swcProvider.tsConfig;
    }

    /**
     * Execution order is important.
     *
     * @name zVm.providers
     *
     * @type {import("./providers/base").ProviderBase[]}
     */
    const providers = [
        new ( await import( "./providers/relative-provider.js" ) ).RelativeProvider( {
            tsConfig,
            extensions: config.extensions,
        } ),
    ];

    if ( externalConfig.workspacePath ) {
        providers.push( new ( await import( "./providers/workspace-provider.js" ) ).WorkspaceProvider( {
            tsConfig,
            workspacePath: config.paths.workspacePath,
            extensions: config.extensions,
        } ) );
    }

    providers.push( new ( await import( "./providers/node-provider.js" ) ).NodeProvider( {
        nodeModulesPath: config.paths.nodeModules,
        projectPath: config.paths.project,
    } ) );

    if ( "undefined" !== typeof tsConfig.options?.paths && Object.keys( tsConfig.options?.paths ).length ) {
        // Convert parsed typescript paths to tsconfig-paths compatible.
        /**
         * @type {{ [ key: string ]: string[] }}
         */
        const tsConfigPaths = {};

        Object.entries( tsConfig.options.paths ).forEach( ( [ key, value ] ) => {
            if ( ! tsConfigPaths[ key ] ) {
                tsConfigPaths[ key ] = [];
            }

            tsConfigPaths[ key ].push( ... value );
        } );

        providers.push( new ( await import( "./providers/ts-paths-provider.js" ) ).TsPathsProvider( {
            baseUrl: tsConfig.options.baseUrl,
            paths: tsConfigPaths,
            extensions: config.extensions,
        } ) );
    }

    if ( externalConfig.useTsNode ) {
        providers.push( tsNodeProvider );
    } else if ( externalConfig.useSwc ) {
        providers.push( swcProvider );
    }

    // Other no resolvers providers, order is not important.
    providers.push(
        new ( await import( "./providers/json-provider.js" ) ).JsonProvider(),
    );

    /**
     * @name zVm.sandbox
     */
    const sandbox = {
        context: createContext( externalConfig.vmContext, externalConfig.vmContextOptions ),
    };

    /**
     * @param {string} entrypointPath
     * @param {Loaders} loaders
     * @param {Resolvers} resolvers
     */
    function auto( entrypointPath, loaders, resolvers ) {
        const argIndex = process.argv.findIndex( a => a === "--zvm-memory-verbose" );

        if  ( argIndex !== -1 ) {
            let mode = process.argv[ argIndex + 1 ];

            switch( mode ) {
                case "isolated": {
                    mode = "summary"
                }
                break;

                default:
                case "total":
                    mode = "detailed";
                    break;
            }

            const printMemoryUsage = () =>{
                /**
                 * @typedef {ReturnType<typeof import("node:vm").measureMemory>} ResultPromise
                 */
                measureMemory( {
                    mode,
                    execution: "eager"
                } ).then( ( result ) => {
                    /**
                     * @type {Awaited<ResultPromise>}
                     */
                    const usage = result;

                    // Convert to MB.
                    const formated  = {
                        estimate: ( Math.round( usage.total.jsMemoryEstimate / 1024 / 1024 * 100 ) / 100  ) + "MB",
                        low: ( Math.round( usage.total.jsMemoryRange[ 0 ] / 1024 / 1024 * 100 ) / 100  ) + "MB",
                        high: ( Math.round( usage.total.jsMemoryRange[ 1 ] / 1024 / 1024 * 100 ) / 100  ) + "MB",
                    };

                    console.log( "--zvm-memory-verbose with mode:", mode, util.inspect( formated ) );
                } );
            };

            printMemoryUsage();

            setInterval( printMemoryUsage, mode === "summary" ? 10000 : 1000 );
        }

        return new Promise( ( resolve, reject ) => {
            setTimeout( () => {
                async function linker( modulePath, referencingModule ) {
                    verbose( 'core', 'linker', () => `linker() called for: ${ util.inspect( modulePath ) } referer ${ util.inspect( "file://" + referencingModule.identifier ) }` );
                    const result = await resolvers.try( modulePath, referencingModule ).resolve()
                        .catch( ( error ) => /* Lazy... but works */ referencingModule = error.referencingModule );

                    if ( result.provider ) {
                        let type,
                            modulePath;

                        switch ( result.provider.name ) {
                            case "node":
                                // TODO If file includes "." dot
                                if ( path.extname( result.resolvedPath ) === ".json" ) {
                                    type = "json";
                                    modulePath = result.resolvedPath;

                                    break;
                                }
                                if ( path.extname( result.resolvedPath ) === ".ts" ) {
                                    type = "esm";
                                    modulePath = result.resolvedPath;
                                    break;
                                }
                                type = "node";
                                modulePath = result.resolvedPath;
                                break;

                            case "workspace":
                            case "relative":
                            case "ts-paths":
                            case "tsnode-esm":
                            case "swc":
                                modulePath = result.resolvedPath;

                                if ( path.extname( result.resolvedPath ) === ".json" ) {
                                    type = "json";
                                    break;
                                }

                                type = "esm";
                                break;

                            default:
                                throw new Error( `Unknown provider: ${ util.inspect( result.provider.name ) }`, {
                                    cause: result
                                } );
                        }

                        return loaders.loadModule( modulePath, type, referencingModule,linker );
                    }

                    throw new Error( `Module not found: ${ util.inspect( modulePath ) } referer ${ util.inspect( "file://" + referencingModule.identifier ) }` );
                }

                loaders.loadModule( entrypointPath, "esm", null , linker )
                    .then( ( result ) => {
                        verbose( 'core', 'linker', () => `Resolved to: ${ util.inspect( result ) }`)
                        resolve( result );
                    } )
                    .catch( ( err ) => {
                        verbose( 'core', 'linker', () => `Failed to resolve: ${ util.inspect( err ) }`)
                        reject( err );
                    } );
            } );
        } );
    }

    return {
        config,
        sandbox,

        providers,

        auto,
    };
};

export const vm = {
    defineConfig,

    /**
     * @param {(vm: zVm) => void} callback
     */
    tap: ( callback ) => {
        initializePromise.promise.then( callback.bind( null, vm ) );
    },
};

/**
 * @name zVm
 * @typedef zVm
 * @type {Awaited<ReturnType<typeof initialize>>}
 */
initialize()
    .then( vmLoaded => Object.assign( vm, vmLoaded ) )
    .then( initializePromise.resolve );

