import { QueryComponent } from "@zenflux/react-query/src/query-component";

import { queryTanstackClient } from "@zenflux/react-query/src/query-tanstack-adapter";

import type { DQueryModuleBaseStatic } from "@zenflux/react-query/src/query-definitions";

import type { QueryModuleBase } from "@zenflux/react-query/src/query-module-base";

import type { QueryTanstackClient } from "@zenflux/react-query/src/query-tanstack-adapter";

export class QueryClient {
    private modules: Record<string, QueryModuleBase> = {};

    private readonly tanstackClientRef: QueryTanstackClient = queryTanstackClient;

    public constructor( private baseURL: string ) {
        QueryComponent.setClient( this );
    }

    public fetch( method: string, route: string, args: any, handler: ( response: Response ) => any ) {
        const url = new URL( `${ this.baseURL }/${ route }` );

        for ( const key in args ) {
            url.pathname = url.pathname.replace( `:${ key }`, args[ key ] );
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

    public getModule( module: DQueryModuleBaseStatic ) {
        const moduleName = module.getName();

        if ( ! this.modules[ moduleName ] ) {
            throw new Error( `Query module ${ moduleName } not registered` );
        }

        return this.modules[ moduleName ];
    }
    public registerModule( module: DQueryModuleBaseStatic ) {

        const moduleName = module.getName();

        if ( this.modules[ moduleName ] ) {
            // TODO: Enable when hot reloading is implementedd
            throw new Error(`Query module ${moduleName} already registered`);
        }

        this.modules[ moduleName ] = new module( this );
    }

    public get Component() {
        return QueryComponent;
    }

    public get tanstack() {
        return this.tanstackClientRef;
    }
}
