/**
 * @author Leonid Vinikov <leonidvinikov@gmail.com>
 */
import util from "node:util";

import { verbose } from "./utils.js";

// TODO: Add switch to disable caching.

export class Resolvers {
    /**
     * @param {zVm} vm
     */
    constructor( vm ) {
        this.vm = vm;
        this.cache = new Map();
    }

    /**
     * @param {string} modulePath
     * @param {import("node:vm").Module} referencingModule
     */
    try( modulePath, referencingModule ) {
        verbose( "resolvers", "try",
            () => `resolving: ${ util.inspect( modulePath ) }, status: ${ util.inspect( referencingModule.status ) } referer: ${ util.inspect( referencingModule.identifier ) }` );

        let middleware = ( request ) =>
            verbose( "resolvers", "try().middleware",
                () => `requesting: ${ util.inspect( request.modulePath ) } provider: ${ util.inspect( request.provider?.name || "null" ) } trying with path: ${ util.inspect( request.resolvedPath ) }` );


        const tryPromise = () => new Promise( async ( resolve, reject ) => {
            let resolvedPath;

            for ( const provider of this.vm.providers ) {
                resolvedPath = await provider.resolve.call( provider, modulePath, referencingModule, middleware );

                if ( resolvedPath ) {
                    const result = {
                        provider,
                        resolvedPath,
                        modulePath,
                        referencingModule,
                    };

                    this.cache.set( modulePath, result );

                    return resolve( result );
                }
            }

            reject( {
                modulePath,
                referencingModule,
            } );
        } );

        const callbacks = {
            /**
             * @param {zVmResolverMiddlewareCallback} callback
             */
            middleware: ( callback ) => {
                middleware = callback;

                return callbacks;
            },

            /**
             * @param {zVmResolverMiddlewareCallback} [callback]
             *
             * @return {Promise<zVmResolverRequest>}
             */
            resolve: async ( callback ) => {
                const result = this.cache.has( modulePath ) ? this.cache.get( modulePath ) : await tryPromise();

                verbose( "resolvers", "try().resolve", () => `resolved: ${ util.inspect( result.modulePath ) } provider: ${ util.inspect( result.provider?.name || "null" ) } with path: ${ util.inspect( result.resolvedPath ) }` );

                callback?.( result );

                return result;
            }
        };

        return callbacks;
    }
}
