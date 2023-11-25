import fs from "node:fs";
import path from "node:path";

import { createRequire } from "node:module";

import { isCommonPathFormat } from "../utils.js";

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

    async resolve( modulePath, referencingModule, middleware ) {
        middleware( { modulePath, referencingModule, provider: this } );

        if ( isCommonPathFormat( modulePath ) ) {
            return (
                modulePath.includes( this.projectPath ) &&
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
        const nodeModulePath = path.resolve( this.nodeModulesPath, modulePath );

        middleware( { resolvedPath: nodeModulePath, modulePath, referencingModule, provider: this } );

        return fs.existsSync( nodeModulePath ) ? nodeModulePath : null;
    }

    async load( path, options ) {
        return import( path );
    }
}
