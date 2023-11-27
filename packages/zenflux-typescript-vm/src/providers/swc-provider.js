import fs from "node:fs";
import inspector from "node:inspector";

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
    loadedFiles;

    /**
     * @type {typeof import("@swc/types").Config.sourceMaps}
     */
    sourceMapFlag;

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

        this.loadedFiles = {};
    }

    initialize() {
        this.tsConfig = readTsConfig( this.tsConfigPath, ( path ) => {
            this.tsReadConfigCallback( path );

            return fs.readFileSync( path, "utf-8" );
        } );

        this.swcConfig = convertTsConfig( this.tsConfig, {} );

        // If debugger present, inline source maps, otherwise breakpoints won't work
        this.sourceMapFlag = inspector.url() ? "inline" : this.swcConfig.sourceMaps;

        const uncaughtExecutionHandler = ( reason, promise ) => {
            sourceMapSupport.install( {
                retrieveSourceMap: ( path ) => {
                    if ( this.loadedFiles[ path ] ) {
                        const source = fs.readFileSync( path.replace( "file://", "" ), "utf-8" );

                        const result = swc.transformSync( source, {
                            ...this.swcConfig,
                            filename: path,
                            sourceMaps: true,
                        } );

                        return {
                            url: null,
                            map: result.map,
                        };
                    }

                    return null;
                },
            } );

            process.removeListener( "uncaughtException", uncaughtExecutionHandler );

            // Re-emit the exception
            process.emit( "uncaughtException", reason, promise );
        };

        // SWC unable to handle valid source maps in vm, so we need correct it
        process.on( "uncaughtException", uncaughtExecutionHandler );
    }

    async resolve( modulePath, referencingModule, middleware ) {
        // No dedicated resolver
        return null;
    }

    async load( path, options ) {
        const source = fs.readFileSync( path, "utf-8" );

        this.loadedFiles[ "file://" + path ] = true;

        const result = await swc.transform( source, {
            ...this.swcConfig,
            filename: path,
            // Since the code runs from memory, we need to inline the source maps
            sourceMaps: this.sourceMapFlag,
        } );

        return result.code;
    }
}
