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

import { createContext } from "node:vm";

import { createResolvablePromise, getAbsoluteOrRelativePath } from "./utils.js";
import { defineConfig, externalConfig, waitForConfig } from "./config.js";

export { Resolvers } from "./resolvers.js";
export { Loaders } from "./loaders.js";

// Ensure '--experimental-vm-modules' flag is enabled.
if ( ! process.execArgv.includes( '--experimental-vm-modules' ) ) {
    throw new Error( "Please enable '--experimental-vm-modules' flag" );
}

util.inspect.defaultOptions.colors = true;
util.inspect.defaultOptions.breakLength = 1;

const initializePromise = createResolvablePromise();

const initialize = async () => {
    // Wait for config to be defined.
    await waitForConfig();

    const paths = {
        project: getAbsoluteOrRelativePath( externalConfig.projectPath ),

        workspacePath: null,

        nodeModules: getAbsoluteOrRelativePath( externalConfig.nodeModulesPath, externalConfig.projectPath ),

        tsConfigPath: getAbsoluteOrRelativePath( externalConfig.tsConfigPath, externalConfig.projectPath ),
    };

    if ( externalConfig.workspacePath ) {
        paths.workspacePath = getAbsoluteOrRelativePath( externalConfig.workspacePath, externalConfig.projectPath );
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
    };

    // TODO: Find better solution.
    let tsOptions, tsNodeProvider;
    if ( externalConfig.useTsNode ) {
        tsNodeProvider =
            new ( ( await import( "./providers/ts-node-provider.js" ) ).TsNodeProvider )( {
                skipInitialize: true,

                tsConfigPath: config.paths.tsConfigPath,
                tsConfigReadCallback: externalConfig.tsConfigVerbose
            } );

        tsNodeProvider.initialize();

        tsOptions = tsNodeProvider.service.config.options;
    }

    /**
     * Execution order is important.
     *
     * @name zVm.providers
     *
     * @type {import("./providers/base").ProviderBase[]}
     */
    const providers = [
        new ( await import( "./providers/relative-provider.js" ) ).RelativeProvider(),
    ];

    if ( externalConfig.workspacePath ) {
        providers.push( new ( await import( "./providers/workspace-provider.js" ) ).WorkspaceProvider( {
            workspacePath: config.paths.workspacePath,
            extensions: config.extensions,
        } ) );
    }

    providers.push( new ( await import( "./providers/node-provider.js" ) ).NodeProvider( {
        nodeModulesPath: config.paths.nodeModules,
        projectPath: config.paths.project,
    } ) );

    if ( "undefined" !== typeof tsOptions.paths && Object.keys( tsOptions.paths ).length ) {
        providers.push( new ( await import( "./providers/ts-paths-provider.js" ) ).TsPathsProvider( {
            baseUrl: tsOptions.baseUrl,
            paths: tsOptions.paths,
            extensions: config.extensions,
        } ) );
    }

    if ( externalConfig.useTsNode ) {
        providers.push( tsNodeProvider );
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
        // defer to next tick, allow to load all providers.
        return new Promise( ( resolve, reject ) => {
            setTimeout( () => {
                async function linker( modulePath, referencingModule ) {
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
                                type = "node";
                                modulePath = result.modulePath;
                                break;

                            case "workspace":
                            case "relative":
                            case "ts-paths":
                            case "tsnode-esm":
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


                        return loaders.loadModule( modulePath, type, linker );
                    }

                    throw new Error( `Module not found: ${ util.inspect( modulePath ) } referer ${ util.inspect( referencingModule.identifier ) }` );
                }

                loaders.loadModule( entrypointPath, "esm", linker )
                    .then( resolve )
                    .catch( reject );
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
