import fs from "node:fs";

import { isCommonPathFormat } from "../utils.js";

import { ProviderBase } from "./base/provider-base.js";
import { createMatchPathAsync } from "tsconfig-paths";

export class TsPathsProvider extends ProviderBase {
    static getName() {
        return "ts-paths";
    }

    static getType() {
        return null;
    }

    /**
     * @type {string}
     */
    baseUrl;

    /**
     * @type {string[][]}
     */
    paths;

    /**
     * @type {string[]}
     */
    extensions;

    /**
     * @type {ReturnType<createMatchPathAsync>}
     */
    matchPath;

    /**
     * @override
     *
     * @param {object} args
     * @param {string} args.baseUrl
     * @param {string[][]} args.paths
     * @param {string[]} args.extensions
     */
    constructor( args ) {
        super();

        this.baseUrl = args.baseUrl;
        this.paths = args.paths;
        this.extensions = args.extensions;
    }

    initialize() {
        this.matchPath = createMatchPathAsync( this.baseUrl, this.paths );
    }

    async resolve( modulePath, referencingModule, middleware ) {
        middleware( { modulePath, referencingModule, provider: this.provider } );

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

            this.matchPath( modulePath, undefined, async ( resolvedPath, doneCallback ) => {
                    middleware( { resolvedPath, modulePath, referencingModule, provider: this.provider } );

                    // Check file exists. only for files
                    if ( fs.existsSync( resolvedPath ) && fs.statSync( resolvedPath )?.isFile() ) {
                        lastExistsPath = resolvedPath;

                        return doneCallback( undefined, true );
                    }

                    // Continue searching.
                    doneCallback();
                },

                this.extensions,

                ( error, path ) => {
                    error ? reject( error ) : resolve( lastExistsPath );
                } );
        } );
    }

    load( path, options ) {
        // No dedicated loader for ts-paths.
        return null;
    }
}
