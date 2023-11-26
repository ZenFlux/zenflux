import fs from "node:fs";

import swc from "@swc/core";

import { convertTsConfig, readTsConfig } from "@zenflux/tsconfig-to-swc";

import { ProviderBase } from "./base/provider-base.js";

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
     * @type {import("ts-node").RegisterOptions["readFile"]}
     */
    tsReadConfigCallback;

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
    }

    initialize() {
        this.tsConfig = readTsConfig( this.tsConfigPath, ( path ) => {
            this.tsReadConfigCallback( path );

            return fs.readFileSync( path, "utf-8" );
        } );

        this.swcConfig = convertTsConfig( this.tsConfig );
    }

    async resolve( modulePath, referencingModule, middleware ) {
        // No dedicated resolver
        return null;
    }

    async load( path, options ) {
        const source = fs.readFileSync( path, "utf-8" );

        const result = await swc.transform( source, {
            ...this.swcConfig,
            filename: path,
        } );

        return result.code;
    }
}
