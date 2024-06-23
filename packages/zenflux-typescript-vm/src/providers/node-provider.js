import fs from "node:fs";
import path from "node:path";

import { createRequire } from "node:module";

import { zIsUnixOrFileProtocolPath } from "@zenflux/utils/src/path";

import { ProviderBase } from "./base/provider-base.js";

const require = createRequire( import.meta.url );

export class NodeProvider extends ProviderBase {
    static getName() {
        return "node";
    }

    static getType() {
        return "node";
    }

    /**
     * @type {string}
     */
    nodeModulesPath;

    /**
     * @type {string}
     */
    projectPath;

    /**
     * @type {Map<string, string>}
     */
    resolveCache = new Map();

    /**
     * @override
     *
     * @param {object} args
     * @param {string} args.nodeModulesPath
     * @param {string} args.projectPath
     */
    constructor( args ) {
        super();

        this.nodeModulesPath = args.nodeModulesPath;
        this.projectPath = args.projectPath;
    }

    resolveESM( modulePath, referencingModule, middleware ) {
        let result;

        // Node resolve for esm
        try {
            const resolve = import.meta.resolve( modulePath, "file://" + referencingModule.identifier );

            result = resolve.replace( "file://", "" );

            middleware( { resolvedPath: result, modulePath, referencingModule, provider: this } );

            this.resolveCache.set( resolve, "esm" );
        } catch ( e ) {
        }

        return result;
    }

    resolveCJS( modulePath, referencingModule, middleware ) {
        let result;

        try {
            const resolve = require.resolve( modulePath );

            if ( require.resolve( modulePath ) === modulePath ) {
                // Built in modules
                result = modulePath;
            } else {
                result = resolve;
            }

            middleware( { resolvedPath: result, modulePath, referencingModule, provider: this } );

            this.resolveCache.set( resolve, "cjs" );
        } catch ( e ) {
        }

        return result;
    }


    async resolve( modulePath, referencingModule, middleware ) {
        middleware( { modulePath, referencingModule, provider: this } );

        if ( zIsUnixOrFileProtocolPath( modulePath ) ) {
            return (
                modulePath.includes( this.projectPath ) &&
                fs.statSync( modulePath ).isFile()
            ) ? modulePath : null;
        }

        const nodeResolve =
            this.resolveESM( modulePath, referencingModule, middleware ) ||
            this.resolveCJS( modulePath, referencingModule, middleware );

        if ( nodeResolve ) {
            return nodeResolve;
        }

        // Check if node module exists.
        const nodeModulePath = path.resolve( this.nodeModulesPath, modulePath );

        middleware( { resolvedPath: nodeModulePath, modulePath, referencingModule, provider: this } );

        return this.fileExistsSync( nodeModulePath );
    }

    async load( path, options ) {
        const isCjs = this.resolveCache.get( path ) === "cjs";

        if ( isCjs ) {
            return require( path );
        }

        return await import( path );
    }

}
