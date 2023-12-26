import util from "node:util";
import fs from "node:fs";

import { ProviderBase } from "./base/provider-base.js";

export class JsonProvider extends ProviderBase {
    static getName() {
        return "json";
    }

    static getType() {
        return "json";
    }

    async load( path, options ) {
        const json = fs.readFileSync( path, 'utf8' );

        if ( ! json ) {
            throw new Error( `JSON file not found at: ${ util.inspect( path ) }` );
        }

        try {
            return JSON.parse( json
                // Remove trailing commas
                .replace( /,\s*([\]}])/g, "$1" )
            );
        } catch ( e ) {
            e.message += `\ncaused by: ${ util.inspect( "file://" + path ) }`;
            throw e;
        }
    }

    resolve( modulePath, referencingModule, middleware ) {
        // No dedicated resolver for json files
        return null;
    }
}
