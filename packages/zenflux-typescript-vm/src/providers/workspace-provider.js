import path from "node:path";

import { createRequire } from "node:module";

import { zGetMatchingPathsRecursive, zIsUnixOrFileProtocolPath } from "@zenflux/utils/path";

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
    workspaceCache = new Map();

    /**
     * @type {Map<string, any>}
     */
    packagesCache = new Map();

    /**
     * @param {WorkspaceProviderArgs} args
     */
    constructor( args ) {
        super();

        this.workspacePath = args.workspacePath;
        this.extensions = args.extensions;


    }

    async initialize() {
        const projectsPaths = [];

        if ( this.workspacePath ) {
            // Read root `package.json`
            const rootPkgPath = path.resolve( this.workspacePath, "package.json" ),
                rootPkg = require( rootPkgPath );

            // Get all projects from `package.json` workspaces.
            projectsPaths.push(
                ...await this.findPackageDirectories( rootPkg.workspaces, this.workspacePath )
            );
        }

        this.workspaceCache = new Map();
        this.packagesCache = new Map();

        // Create paths that will be used later to resolve modules.
        projectsPaths.forEach( ( projectPath ) => {
            const pkg = require( path.resolve( projectPath, "package.json" ) );

            this.workspaceCache.set( pkg.name, projectPath );
            this.packagesCache.set( pkg.name, pkg );
        } );
    }

    async findPackageDirectories( packagesPaths, rootPath ) {
        const paths = await Promise.all( packagesPaths.map( async ( packagesPathPattern ) => {

            if ( ! rootPath ) {
                rootPath = path.dirname( packagesPathPattern );
            }

            return zGetMatchingPathsRecursive(
                path.join( rootPath, path.dirname( packagesPathPattern ) ),
                new RegExp( "/*/package.json" ),
                2, {
                    ignoreStartsWith: [ ".", "#" ]
                }
            );
        } ) );

        return paths.flat().map( packageJsonPath => path.dirname( packageJsonPath ) );
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
                    if ( Array.isArray( packageJson.exports[ key ] ) ) {
                        for ( const exportPath of packageJson.exports[ key ] ) {
                            const potentialPath = path.join( packagePath, exportPath, modulePath );

                            if ( this.fileExistsSync( potentialPath ) ) {
                                resolvedPath = potentialPath;
                                break;
                            }
                        }
                    } else if ( typeof packageJson.exports[ key ] === 'string' ) {
                        resolvedPath = path.join( packagePath, packageJson.exports[ key ]);
                    } else if ( typeof packageJson.exports[ key ] === 'object' ) {
                        resolvedPath = path.join( packagePath,
                            packageJson.exports[ key ].default ??
                            packageJson.exports[ key ].import ??
                            packageJson.exports[ key ].require
                        );
                    }

                    if ( ! resolvedPath ) {
                        return null;
                    }

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

        if ( zIsUnixOrFileProtocolPath( modulePath ) ) {
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
