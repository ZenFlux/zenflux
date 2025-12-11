import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import * as inspector from "node:inspector";

import swc from "@swc/core";

import { convertTsConfig, readTsConfig } from "@zenflux/tsconfig-to-swc";

import { ProviderBase } from "./base/provider-base.js";
import { DiskCache } from "../disk-cache.js";

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
     * @param {string} [args.cacheDir]
     */
    constructor( args ) {
        super( args );

        this.tsConfigPath = args.tsConfigPath;
        this.tsReadConfigCallback = args.tsConfigReadCallback;

        this.transformedFiles = {};

        const cacheDir = args.cacheDir || path.join( os.tmpdir(), "zenflux-vm-cache", "swc" );
        this.diskCache = new DiskCache( cacheDir );
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

    async load( filePath, options ) {
        const cached = this.diskCache.get( filePath );

        if ( cached ) {
            this.transformedFiles[ filePath ] = cached;
            return cached.output;
        }

        const source = fs.readFileSync( filePath, "utf-8" );

        /**
         * @type {import("@swc/core").Options}
         */
        const swcOptions = {
            ...this.swcConfig,
            filename: filePath,
            sourceMaps: true,
        };

        const result = await swc.transform( source, swcOptions );

        const output = result.code + "\n//# sourceMappingURL=data:application/json;base64," +
            btoa( result.map );

        const cacheEntry = {
            code: result.code,
            map: result.map,
            output,
        };

        this.transformedFiles[ filePath ] = cacheEntry;
        this.diskCache.set( filePath, cacheEntry );

        return output;
    }
}
