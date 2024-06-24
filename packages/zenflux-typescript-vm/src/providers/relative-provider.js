import path from "node:path";

import { zIsUnixOrFileProtocolPath } from "@zenflux/utils/src/path";

import { ProviderBase } from "./base/provider-base.js";

/**
 * @typedef {ProviderBaseArgs} RelativeProviderArgs
 * @property {string[]} extensions
 */

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
     * @param {RelativeProviderArgs} args
     */
    constructor( args ) {
        super();

        this.extensions = args.extensions;
    }

    async resolve( modulePath, referencingModule, middleware ) {
        middleware( { modulePath, referencingModule, provider: this } );

        if ( ! zIsUnixOrFileProtocolPath( modulePath ) ) {
            return;
        }

        // Remove file:// prefix.
        let resolvedPath = path.resolve(
            path.dirname( referencingModule.identifier.replace( "file://", "" ) ),
            modulePath
        ) || null;

        middleware( { resolvedPath, modulePath, referencingModule, provider: this } );

        // If no dot is present, try to resolve the file with the extensions.
        if ( ! this.fileExistsSync( resolvedPath ) && ! path.basename( resolvedPath ).includes( "." ) ) {
            for ( const extension of this.extensions ) {
                const resolvedPathWithExtension = `${ resolvedPath }${ extension }`;

                middleware( { resolvedPath: resolvedPathWithExtension, modulePath, referencingModule, provider: this } );

                if ( this.fileExistsSync( resolvedPathWithExtension ) ) {
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
