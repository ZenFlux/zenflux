import path from "node:path";
import fs from "node:fs";

import { isCommonPathFormat } from "../utils.js";

import { ProviderBase } from "./base/provider-base.js";

export class RelativeProvider extends ProviderBase {
    static getName() {
        return "relative";
    }

    static getType() {
        return null;
    }

    /**
     * @type {string[]}
     */
    extensions;

    /**
     * @override
     *
     * @param {object} args
     * @param {string[]} args.extensions
     */
    constructor( args ) {
        super();

        this.extensions = args.extensions;
    }

    async resolve( modulePath, referencingModule, middleware ) {
        middleware( { modulePath, referencingModule, provider: this } );

        if ( ! isCommonPathFormat( modulePath ) ) {
            return;
        }

        // Remove file:// prefix.
        let resolvedPath = path.resolve(
            path.dirname( referencingModule.identifier.replace( "file://", "" ) ),
            modulePath
        ) || null;

        middleware( { resolvedPath, modulePath, referencingModule, provider: this } );

        // If no dot is present, try to resolve the file with the extensions.
        if ( ! fs.existsSync( resolvedPath ) && ! path.basename( resolvedPath ).includes( "." ) ) {
            for ( const extension of this.extensions ) {
                const resolvedPathWithExtension = `${ resolvedPath }${ extension }`;

                middleware( { resolvedPath: resolvedPathWithExtension, modulePath, referencingModule, provider: this } );

                if ( fs.existsSync( resolvedPathWithExtension ) ) {
                    resolvedPath = resolvedPathWithExtension;
                    break;
                }
            }
        }

        return resolvedPath;
    }

    load( path, options ) {
        // No dedicated loader for relative paths.
        return null;
    }
}
