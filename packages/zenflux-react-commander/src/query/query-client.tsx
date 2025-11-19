import { QueryComponent } from "@zenflux/react-commander/query/component";

import { queryCreateMemoryCache } from "@zenflux/react-commander/query/cache";

import type { DQueryModuleBaseStatic } from "@zenflux/react-commander/query/definitions";

import type { QueryModuleBase } from "@zenflux/react-commander/query/module-base";

import type { QueryCache } from "@zenflux/react-commander/query/cache";

export class QueryClient {
    private modules: Record<string, QueryModuleBase<object>> = {};

    private readonly cacheRef: QueryCache;

    public constructor( private baseURL: string, cache?: QueryCache ) {
        QueryComponent.setClient( this );
        this.cacheRef = cache ?? queryCreateMemoryCache();
    }

    public fetch( method: string, route: string, args: Record<string, unknown>, handler: ( response: Response ) => Promise<unknown> ) {
        const url = new URL( `${ this.baseURL }/${ route }` );

        for ( const key in args ) {
            url.pathname = url.pathname.replace( `:${ key }`, String( args[ key ] ) );
        }

        const promise = globalThis.fetch( url.toString(), {
            method,
            headers: {
                "Content-Type": "application/json",
            },
            body: method === "GET" ? undefined : JSON.stringify( args ),
        } );

        return promise.then( handler );
    }

    public getModule<TResource extends object = object>( module: DQueryModuleBaseStatic<TResource> ): QueryModuleBase<TResource> {
        const moduleName = module.getName();

        if ( ! this.modules[ moduleName ] ) {
            throw new Error( `Query module ${ moduleName } not registered` );
        }

        return this.modules[ moduleName ] as unknown as QueryModuleBase<TResource>;
    }

    public registerModule<TResource extends object = object>( module: DQueryModuleBaseStatic<TResource> ) {

        const moduleName = module.getName();

        if ( this.modules[ moduleName ] ) {
            throw new Error( `Query module ${ moduleName } already registered` );
        }

        this.modules[ moduleName ] = new module( this ) as unknown as QueryModuleBase<object>;
    }

    public get Component() {
        return QueryComponent;
    }

    public get cache() {
        return this.cacheRef;
    }
}
