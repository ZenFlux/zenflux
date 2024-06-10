import fs from "node:fs";
import * as inspector from "node:inspector";

import swc from "@swc/core";

import { convertTsConfig, readTsConfig } from "@zenflux/tsconfig-to-swc";

import { ProviderBase } from "./base/provider-base.js";

import sourceMapSupport from "source-map-support";

export class SwcProvider extends ProviderBase {
    static getName() {
        return "swc";
    }

    static getType() {
        return "esm";
    }

    /**
     * @type {string}
     */
    tsConfigPath;

    /**
     * @type {( path:string ) => string|undefined}
     */
    tsReadConfigCallback;

    /**
     * @type {object}
     */
    transformedFiles;


    /**
     * @override
     *
     * @param {object} args
     * @param {string} args.tsConfigPath
     * @param {( path:string ) => string|undefined } args.tsConfigReadCallback
     */
    constructor( args ) {
        super( args );

        this.tsConfigPath = args.tsConfigPath;
        this.tsReadConfigCallback = args.tsConfigReadCallback;

        this.transformedFiles = {};
    }

    initialize() {
        this.tsConfig = readTsConfig( this.tsConfigPath, ( path ) => {
            this.tsReadConfigCallback( path );

            return fs.readFileSync( path, "utf-8" );
        } );

        this.swcConfig = convertTsConfig( this.tsConfig, {} );

        // SWC unable to handle valid source maps in vm, so we need correct it
        sourceMapSupport.install( {
            retrieveSourceMap: ( path ) => {
                const pathSafe = path.replace( "file://", "" );

                if ( this.transformedFiles[ pathSafe ]?.map ) {
                    return {
                        url: path,
                        map: this.transformedFiles[ pathSafe ].map,
                    }
                } else if ( inspector.url() ) {
                    console.warn( `Source map for ${ path } not found` );
                }

                return null;
            },
        } );
    }

    async resolve( modulePath, referencingModule, middleware ) {
        // No dedicated resolver
        return null;
    }

    async load( path, options ) {
        const source = fs.readFileSync( path, "utf-8" );

        /**
         * @type {import("@swc/core").Options}
         */
        const swcOptions = {
            ...this.swcConfig,
            filename: path,
            sourceMaps: true,
        };

        const result = await swc.transform( source, swcOptions );

        this.transformedFiles[ path ] = result;

        // Since the code runs from memory, and the source always comes from the file system,
        return result.code + '\n//# sourceMappingURL=data:application/json;base64,' +
            btoa( result.map );
    }
}
