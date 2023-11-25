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

    async resolve( modulePath, referencingModule, middleware ) {
        middleware( { modulePath, referencingModule, provider: this } );

        if ( ! isCommonPathFormat( modulePath ) ) {
            return;
        }

        // Remove file:// prefix.
        const resolvedPath = path.resolve(
            path.dirname( referencingModule.identifier.replace( "file://", "" ) ),
            modulePath
        );

        middleware( { resolvedPath, modulePath, referencingModule, provider: this } );

        if ( ! fs.existsSync( resolvedPath ) ) {
            return;
        }

        return resolvedPath;
    }

    load( path, options ) {
        // No dedicated loader for relative paths.
        return null;
    }
}
