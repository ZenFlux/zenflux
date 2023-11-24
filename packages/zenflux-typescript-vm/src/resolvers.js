/**
 * @author Leonid Vinikov <leonidvinikov@gmail.com>
 */
import path from "node:path";
import fs from "node:fs";
import util from "node:util";

import { createRequire } from 'node:module';

import { createMatchPathAsync } from "tsconfig-paths";

import { getMatchingPathsRecursive, isCommonPathFormat, verbose } from "./utils.js";

const require = createRequire( import.meta.url );

// TODO: Add switch to disable caching.

/**
 * @typedef zVmResolverType {"relative" | "nodeModule" | "workspace" | "tsPaths" | "esm"}
 */

/**
 * @typedef {Object} zVmResolverRequest
 * @property {string} modulePath
 * @property {import("node:vm").Module} referencingModule
 * @property {zVmResolverType} type
 * @property {string} [resolvedPath]
 */

/**
 * @typedef {function(zVmResolverRequest)} zVmMiddlewareCallback
 * @callback zVmMiddlewareCallback
 * @param {zVmResolverRequest} request
 */

export class Resolvers {
    /**
     * @param {zVm} vm
     */
    constructor( vm ) {
        this.vm = vm;
        this.cache = new Map();

        this.resolvers = [
            { method: this.resolveRelative, type: "relative" },
        ];

        if ( vm.config.paths.workspacePath ) {
            // Read root `package.json`
            const rootPath = vm.config.paths.workspacePath,
                rootPkgPath = path.resolve( rootPath, "package.json" ),
                rootPkg = require( rootPkgPath );

            // Get all projects from `package.json` workspaces.
            const projectsPaths = ( rootPkg.workspaces ).flatMap( ( workspace ) => {
                const workspaces = getMatchingPathsRecursive( rootPath, new RegExp( workspace ) );

                // Filter packages that contains package.json
                return workspaces.filter( ( workspace ) => {
                    const files = fs.readdirSync( workspace );

                    return files.find( ( file ) => file.endsWith( "package.json" ) );
                } );
            } );

            this.workspaceCache = new Map();

            // Create paths that will be used later to resolve modules.
            projectsPaths.forEach( ( projectPath ) => {
                const pkg = require( path.resolve( projectPath, "package.json" ) );

                this.workspaceCache.set( pkg.name, projectPath );
            } );

            this.resolvers.push( { method: this.resolveWorkspace, type: "workspace" } );
        }

        this.resolvers.push( { method: this.resolveNodeModule, type: "nodeModule" } );

        const tsConfig = vm.node.service.config.options;

        if ( "undefined" !== typeof tsConfig.paths && Object.keys( tsConfig.paths ).length ) {
            this.resolvers.push( { method: this.resolveTSPaths, type: "tsPaths" } );

            /**
             * @type {ReturnType<createMatchPathAsync>}
             */
            this.matchPath = createMatchPathAsync( tsConfig.baseUrl, tsConfig.paths );
        }

        this.resolvers.push( { method: this.resolveEsm, type: "esm" } );
    }

    /**
     * @param {string} modulePath
     * @param {import("node:vm").Module} referencingModule
     */
    try( modulePath, referencingModule ) {
        verbose( "resolvers", "try",
            () => `resolving: ${ util.inspect( modulePath ) }, status: ${ util.inspect( referencingModule.status ) } referer: ${ util.inspect( referencingModule.identifier ) }` );

        let middleware = ( request ) =>
            verbose( "resolvers", "try().middleware",
                () => `requesting: ${ util.inspect( request.modulePath ) } type: ${ util.inspect( request.type ) } trying with path: ${ util.inspect( request.resolvedPath ) }` );

        const tryPromise = () => new Promise( async ( resolve, reject ) => {
            let resolvedPath, resolver;

            for ( const i of this.resolvers ) {
                resolver = i;
                resolvedPath = await resolver.method.call( this, modulePath, referencingModule, middleware );

                if ( resolvedPath ) {
                    const result = {
                        type: resolver.type,
                        resolvedPath,
                        modulePath,
                        referencingModule,
                    };

                    this.cache.set( modulePath, result );

                    return resolve( result );
                }
            }

            reject( {
                modulePath,
                referencingModule,
                type: resolver.type,
            } );
        } );

        const callbacks = {
            /**
             * @param {zVmMiddlewareCallback} callback
             */
            middleware: ( callback ) => {
                middleware = callback;

                return callbacks;
            },

            /**
             * @param {zVmMiddlewareCallback} [callback]
             *
             * @return {Promise<zVmResolverRequest>}
             */
            resolve: async ( callback ) => {
                const result = this.cache.has( modulePath ) ? this.cache.get( modulePath ) : await tryPromise();

                verbose( "resolvers", "try().resolve", () => `resolved: ${ util.inspect( result.modulePath ) } type: ${ util.inspect( result.type ) } with path: ${ util.inspect( result.resolvedPath ) }` );

                callback?.( result );

                return result;
            }
        };

        return callbacks;
    }

    /**
     * @param {string} modulePath
     * @param {import("node:vm").Module} referencingModule
     * @param {zVmMiddlewareCallback} middleware
     */
    async resolveRelative( modulePath, referencingModule, middleware = ( request ) => {} ) {
        middleware( { modulePath, referencingModule, type: "relative" } );

        if ( ! isCommonPathFormat( modulePath ) ) {
            return;
        }

        // Remove file:// prefix.
        const resolvedPath = path.resolve(
            path.dirname( referencingModule.identifier.replace( "file://", "" ) ),
            modulePath
        );

        middleware( { resolvedPath, modulePath, referencingModule, type: "relative" } );

        if ( ! fs.existsSync( resolvedPath ) ) {
            return;
        }

        return resolvedPath;
    }

    /**
     * @param {string} modulePath
     * @param {import("node:vm").Module} referencingModule
     * @param {zVmMiddlewareCallback} middleware
     */
    async resolveNodeModule( modulePath, referencingModule, middleware = ( request ) => {} ) {
        middleware( { modulePath, referencingModule, type: "nodeModule" } );

        if ( isCommonPathFormat( modulePath ) ) {
            return (
                modulePath.includes( this.vm.config.paths.project ) &&
                fs.statSync( modulePath ).isFile()
            ) ? modulePath : null;
        }

        // Built-in modules.
        try {
            if ( require.resolve( modulePath ) === modulePath ) {
                return modulePath;
            }
        } catch ( e ) {
            // TODO: Find a better way to check if module is built-in.
        }

        // Check if node module exists.
        const nodeModulePath = path.resolve( this.vm.config.paths.nodeModules, modulePath );

        middleware( { resolvedPath: nodeModulePath, modulePath, referencingModule, type: "nodeModule" } );

        return fs.existsSync( nodeModulePath ) ? nodeModulePath : null;
    }

    /**
     * @param {string} modulePath
     * @param {import("node:vm").Module} referencingModule
     * @param {zVmMiddlewareCallback} middleware
     */
    async resolveWorkspace( modulePath, referencingModule, middleware ) {
        middleware( { modulePath, referencingModule, type: "workspace" } );

        if ( isCommonPathFormat( modulePath ) ) {
            return null;
        }

        // Check if package exists in workspace.
        const [ workspaceName, workspacePackage ] = modulePath.split( "/" ),
            packageName = `${ workspaceName }/${ workspacePackage }`;

        if ( ! this.workspaceCache.has( packageName  ) ) {
            return null;
        }

        modulePath = modulePath.replace( packageName, this.workspaceCache.get( packageName ) );

        function checkWorkspaceModuleExists( workspacePath, modulePath ) {
            const workspaceModulePath = path.resolve( workspacePath, modulePath );

            middleware( { resolvedPath: workspaceModulePath, modulePath, referencingModule, type: "workspace" } );

            return fs.existsSync( workspaceModulePath ) ? workspaceModulePath : null;
        }

        const { extensions } = this.vm.config.tsPaths;

        for( const ext of extensions ) {
            const workspaceModulePath = checkWorkspaceModuleExists(
                this.vm.config.paths.workspacePath,
                `${ modulePath }${ ext }`
            );

            if ( workspaceModulePath ) {
                return workspaceModulePath;
            }

            // Retry with index.*
            const workspaceModuleIndexPath = checkWorkspaceModuleExists(
                this.vm.config.paths.workspacePath,
                path.join( modulePath, `index${ ext }` )
            );

            if ( workspaceModuleIndexPath ) {
                return workspaceModuleIndexPath;
            }
        }

        return null;
    }

    /**
     * @param {string} modulePath
     * @param {import("node:vm").Module} referencingModule
     * @param {zVmMiddlewareCallback} middleware
     */
    async resolveTSPaths( modulePath, referencingModule, middleware = ( request ) => {} ) {
        middleware( { modulePath, referencingModule, type: "tsPaths" } );

        // Is modulePath is relative path or absolute path, skip.
        if ( isCommonPathFormat( modulePath ) ) {
            return;
        }

        /**
         * TODO: Add try limit, and avoid non common extensions - make it configure able.
         *
         * @description This is a workaround for tsconfig-paths, since they return stripped path.
         */
        return await new Promise( async ( resolve, reject ) => {
            let lastExistsPath = null;

            await this.matchPath( modulePath, undefined, async ( resolvedPath, doneCallback ) => {
                    middleware( { resolvedPath, modulePath, referencingModule, type: "tsPaths" } );

                    // Check file exists. only for files
                    if ( fs.existsSync( resolvedPath ) && fs.statSync( resolvedPath )?.isFile() ) {
                        lastExistsPath = resolvedPath;

                        return doneCallback( undefined, true );
                    }

                    // Continue searching.
                    doneCallback();
                },

                this.vm.config.tsPaths?.extensions,

                ( error, path ) => {
                    error ? reject( error ) : resolve( lastExistsPath );
                } );
        } );
    }

    /**
     * Uses `ts-node` esm hooks to resolve modulePath.
     *
     * @param {string} modulePath
     * @param {import("node:vm").Module} referencingModule
     * @param {zVmMiddlewareCallback} middleware
     */
    async resolveEsm( modulePath, referencingModule, middleware = ( request ) => {} ) {
        middleware( { modulePath, referencingModule, type: "esm" } );

        if ( ! modulePath.startsWith( "file://" ) && ! modulePath.startsWith( "/" ) ) {
            return false;
        }

        const promise = this.vm.node.hooks.esm
            .resolve( modulePath, { parentURL: referencingModule.identifier, }, undefined )
            .then( ( resolved ) => {
                middleware( { resolvedPath: resolved.url, modulePath, referencingModule, type: "esm" } );

                return resolved.url;
            } )
            .catch( ( e ) => {
                const match = e.message.match( /Cannot find (module|package) '(.*)' imported from/ ),
                    url = match[ 2 ];

                middleware( { resolvedPath: url, modulePath, referencingModule, type: "esm" } );
            } );

        return ( await promise )?.url ?? null;
    }
}