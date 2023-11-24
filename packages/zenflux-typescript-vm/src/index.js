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
import { fileURLToPath } from "node:url";

import { createResolvablePromise, getAbsoluteOrRelativePath, verbose } from "./utils.js";

export { Resolvers } from "./resolvers.js";
export { Loaders } from "./loaders.js";

// Ensure '--experimental-vm-modules' flag is enabled.
if ( ! process.execArgv.includes( '--experimental-vm-modules' ) ) {
    throw new Error( "Please enable '--experimental-vm-modules' flag" );
}

util.inspect.defaultOptions.colors = true;
util.inspect.defaultOptions.breakLength =  1;

const defineConfigPromise = createResolvablePromise(),
    initializePromise = createResolvablePromise(),
    externalConfig = {
        projectPath: "./",
        entrypointPath: "src/index.ts",
        nodeModulesPath: "../node_modules",
        workspacePath: "",

        tsConfigPath: "./tsconfig.json",
        tsConfigVerbose: ( path ) => { verbose( "ts-node", "readConfig", () => `reading: ${ util.inspect( path ) }` ); },

        /**
         * @type {import("node:vm").Context}
         */
        vmContext: {},

        /**
         * @type {import("node:vm").CreateContextOptions}
         */
        vmContextOptions: {},

        useTsNode: true,

        tsPathsExtensions: [ ".ts", ".tsx", ".js", ".jsx", ".json" ],
    };

/**
 * @param {typeof externalConfig} config
 */
export function defineConfig( config ) {
    Object.assign( externalConfig, config );

    defineConfigPromise.resolve();
};

const initialize = async () => {
    // Wait for config to be defined.
    await defineConfigPromise.promise;

    const filename = fileURLToPath( import.meta.url ),
        project = getAbsoluteOrRelativePath( externalConfig.projectPath );

    const paths = {
        project,

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

        // TODO: Move out from tsPaths, since workspace configuration has been added - it currently used in workspace configuration too.
        tsPaths: {
            extensions: externalConfig.tsPathsExtensions,
        }
    };


    /**
     * @name zVm.tsNode
     * @type {import("./ts-node.js").default}
     */
    let tsNode;

    if ( externalConfig.useTsNode ) {
        /**
         * @type {import("ts-node").RegisterOptions}
         */
        const registerOptions = {
            project: config.paths.tsConfigPath,

            files: true,

            transpileOnly: true,

            require: [
                "ts-node/register",
            ],

            readFile: ( path ) => {
                externalConfig.tsConfigVerbose( path );

                return fs.readFileSync( path, "utf8" );
            }
        };

        const tsNodeModule = ( await import( "./ts-node.js" ) ).default;

        tsNode = new tsNodeModule( registerOptions );
    }

    const context = createContext( externalConfig.vmContext, externalConfig.vmContextOptions );

    /**
     * @name zVm.sandbox
     */
    const sandbox = {
        context
    };

    /**
     * @param {string} entrypointPath
     * @param {Loaders} loaders
     * @param {Resolvers} resolvers
     */
    function auto( entrypointPath, loaders, resolvers ) {
        async function linker( modulePath, referencingModule ) {
            const result = await resolvers.try( modulePath, referencingModule ).resolve()
                .catch( ( error ) => /* Lazy... but works */ referencingModule = error.referencingModule );

            if ( result.type ) {
                let type,
                    modulePath;

                switch ( result.type ) {
                    case "node-module":
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

                        type = "tsnode-esm";
                        break;

                    default:
                        throw new Error( `Unknown type: ${ util.inspect( result.type ) }`, {
                            cause: result
                        } );
                }


                return loaders.loadModule( modulePath, type, linker );
            }

            throw new Error( `Module not found: ${ util.inspect( modulePath ) } referer ${ util.inspect( referencingModule.identifier ) }` );
        }

        return loaders.loadModule( entrypointPath, "tsnode-esm", linker );
    }

    return {
        config,
        sandbox,

        tsNode,

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
