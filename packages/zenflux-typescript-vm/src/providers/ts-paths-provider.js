import fs from "node:fs";

import { isCommonPathFormat } from "../utils.js";

import { ProviderBase } from "./base/provider-base.js";
import { createMatchPathAsync } from "tsconfig-paths";

/**
 * @typedef {ProviderBaseArgs} TsPathsProviderArgs
 * @property {string[]} extensions
 */

export class TsPathsProvider extends ProviderBase {
    static getName() {
        return "ts-paths";
    }

    static getType() {
        return null;
    }

    /**
     * @type {{[key: string]: Array<string>}}
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
     * @param {TsPathsProviderArgs} args
     */
    constructor( args ) {
        super();

        this.extensions = args.extensions;
    }

    initialize() {
        // Convert parsed typescript paths to tsconfig-paths compatible.
        /**
         * @type {{ [ key: string ]: string[] }}
         */
        const tsConfigPaths = {};

        Object.entries( this.tsConfig.options.paths ).forEach( ( [ key, value ] ) => {
            if ( ! tsConfigPaths[ key ] ) {
                tsConfigPaths[ key ] = [];
            }

            tsConfigPaths[ key ].push( ... value );
        } );

        this.matchPath = createMatchPathAsync( this.tsConfig.options.baseUrl, this.paths );
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
                    if ( this.fileExistsSync( resolvedPath ) && fs.statSync( resolvedPath )?.isFile() ) {
                        lastExistsPath = resolvedPath;

                        return doneCallback( undefined, true );
                    }

                    // Continue searching.
                    doneCallback();
                },

                this.extensions,

                ( error, _path ) => {
                    error ? reject( error ) : resolve( lastExistsPath );
                } );
        } );
    }

    load( path, options ) {
        // No dedicated loader for ts-paths.
        return null;
    }
}
