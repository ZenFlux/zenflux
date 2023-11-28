import fs from "node:fs";

/**
 * @typedef ProviderBaseArgs
 * @property {boolean} [skipInitialize]
 * @property {import("typescript").ParsedCommandLine} [tsConfig]
 */

export class ProviderBase {
    /**
     * @type {zVmModuleType}
     */
    type;

    /**
     * @type {import("typescript").ParsedCommandLine|undefined}
     */
    tsConfig;

    /**
     * @type {{[key: string]: true}|undefined}
     */
    filesMappedFromTsConfig;

    /**
     * @return {string}
     */
    static getName() {
        throw new Error( "Not implemented" );
    }

    /**
     * @return {(zVmModuleType|null)}
     */
    static getType() {
        throw new Error( "Not implemented" );
    }

    /**
     * @param {ProviderBaseArgs} [args]
     */
    constructor( args = {} ) {
        this.args = args;
        this.type = this.constructor.getType();
        this.name = this.constructor.getName();

        if ( args.skipInitialize ) {
            return;
        }

        setTimeout( () => {
            if ( args.tsConfig ) {
                this.tsConfig = args.tsConfig;
            }

            this.initialize( args );

            // May come from extended `initialize` method.
            if ( this.tsConfig ) {
                this.filesMappedFromTsConfig = [];

                for ( const file of this.tsConfig.fileNames ) {
                    this.filesMappedFromTsConfig[ file ] = true;
                }
            }
        } )
    }

    initialize() {}

    /**
     * @public
     *
     * @param {string} modulePath
     * @param {import("node:vm").Module} referencingModule
     * @param {zVmResolverMiddlewareCallback} middleware
     */
    async resolve( modulePath, referencingModule, middleware ) {
        throw new Error( "Not implemented" );
    }

    /**
     * @public
     *
     * @param {string} path
     * @param {zVmModuleLocalTextSourceOptions} [options]
     *
     * @throws {Error}
     *
     * @return {zVmModuleSource}
     */
    async load( path, options ) {
        throw new Error( "Not implemented" );
    }

    /**
     * This method exist to avoid unnecessary file system calls.
     *
     * @param {string} path - The path of the file to check.
     *
     * @return {string|null} - The path of the file if it exists, otherwise null.
     */
    fileExistsSync( path ) {
        if ( this.filesMappedFromTsConfig?.[ path ] ) {
            return path;
        }

        return fs.existsSync( path ) ? path : null;
    }
}
