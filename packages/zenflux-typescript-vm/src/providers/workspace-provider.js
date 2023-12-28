import path from "node:path";
import fs from "node:fs";

import { createRequire } from "node:module";

import { getMatchingPathsRecursive, isCommonPathFormat } from "../utils.js";

import { ProviderBase } from "./base/provider-base.js";

const require = createRequire( import.meta.url );

/**
 * @typedef {ProviderBaseArgs} WorkspaceProviderArgs
 * @property {string} workspacePath
 * @property {string[]} extensions
 */

export class WorkspaceProvider extends ProviderBase {
    static getName() {
        return "workspace";
    }

    static getType() {
        return null;
    }

    /**
     * @type {string[]}
     */
    extensions;

    /**
     * @type {string}
     */
    workspacePath;

    /**
     * @type {Map<string, string>}
     */
    workspaceCache;

    /**
     * @type {Map<string, any>}
     */
    packagesCache;

    /**
     * @param {WorkspaceProviderArgs} args
     */
    constructor( args ) {
        super();

        this.workspacePath = args.workspacePath;
        this.extensions = args.extensions;
    }

    initialize() {
        // Read root `package.json`
        const rootPath = this.workspacePath,
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
        this.packagesCache = new Map();

        // Create paths that will be used later to resolve modules.
        projectsPaths.forEach( ( projectPath ) => {
            const pkg = require( path.resolve( projectPath, "package.json" ) );

            this.workspaceCache.set( pkg.name, projectPath );
            this.packagesCache.set( pkg.name, pkg );
        } );
    }

    /**
     * Try to resolve a module using the "exports" field in package.json
     *
     * @param {string} packageName - The name of the package
     * @param {string} modulePath - The path of the module to resolve
     * @returns {string|null} - The resolved path, or null if it could not be resolved
     */
    resolveUsingExports( packageName, modulePath ) {
        const packagePath = this.workspaceCache.get( packageName );
        if ( ! packagePath ) {
            return null;
        }

        const packageJson = this.packagesCache.get( packageName );
        if ( ! packageJson?.exports ) {
            return null;
        }

        let resolvedPath = null;

        modulePath = modulePath.replace( packageName, "" );

        // If the exports field is an object, we need to find the correct export
        if ( typeof packageJson.exports === 'object' ) {
            const keys = Object.keys( packageJson.exports );
            for ( const key of keys ) {
                if ( key === modulePath || key === `.${ modulePath }` ) {
                    resolvedPath = path.join( packagePath,
                        typeof packageJson.exports[ key ] === 'string' ?
                            packageJson.exports[ key ] :
                        packageJson.exports[ key ].default ??
                        packageJson.exports[ key ].import ??
                        packageJson.exports[ key ].require
                    );
                    break;
                }
            }
        }
        // If the exports field is a string, it's a catch-all export
        else if ( typeof packageJson.exports === 'string' ) {
            return path.join( packagePath, packageJson.exports, modulePath );
        }

        return this.fileExistsSync( resolvedPath );
    }

    async resolve( modulePath, referencingModule, middleware ) {
        middleware( { modulePath, referencingModule, provider: this } );

        if ( isCommonPathFormat( modulePath ) ) {
            return null;
        }

        // Check if package exists in workspace.
        const [ workspaceName, workspacePackage ] = modulePath.split( "/" ),
            packageName = `${ workspaceName }/${ workspacePackage }`;

        if ( ! this.workspaceCache.has( packageName ) ) {
            return null;
        }

        // Try to resolve using exports from package.json
        const resolvedPath = this.resolveUsingExports( packageName, modulePath );
        if ( resolvedPath ) {
            return resolvedPath;
        }

        modulePath = modulePath.replace( packageName, this.workspaceCache.get( packageName ) );

        /**
         * @this {WorkspaceProvider}
         */
        function checkWorkspaceModuleExists( workspacePath, modulePath ) {
            const workspaceModulePath = path.resolve( workspacePath, modulePath );

            middleware( { resolvedPath: workspaceModulePath, modulePath, referencingModule, provider: this } );

            return this.fileExistsSync( workspaceModulePath );
        }

        for ( const ext of this.extensions ) {
            const workspaceModulePath = checkWorkspaceModuleExists.call(
                this,
                this.workspacePath,
                `${ modulePath }${ ext }`
            );

            if ( workspaceModulePath ) {
                return workspaceModulePath;
            }

            // Retry with index.*
            const workspaceModuleIndexPath = checkWorkspaceModuleExists.call(
                this,
                this.workspacePath,
                path.join( modulePath, `index${ ext }` )
            );

            if ( workspaceModuleIndexPath ) {
                return workspaceModuleIndexPath;
            }
        }

        return null;
    }

    load( path, options ) {
        // No dedicated loader for workspace paths.
        return null;
    }
}
