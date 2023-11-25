export class ProviderBase {
    /**
     * @type {zVmModuleType}
     */
    type;

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
     * @param {object} [args]
     * @param {boolean} args.skipInitialize
     */
    constructor( args = {} ) {
        this.args = args;
        this.type = this.constructor.getType();
        this.name = this.constructor.getName();

        if ( args.skipInitialize ) {
            return;
        }

        setTimeout( () => {
            this.initialize( args );
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
}
