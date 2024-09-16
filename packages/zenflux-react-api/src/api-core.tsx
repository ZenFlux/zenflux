import { APIComponent } from "@zenflux/react-api/src/api-component";

import type { APIModuleBaseStatic } from "@zenflux/react-api/src/api-types";

import type { APIModuleBase } from "@zenflux/react-api/src/api-module-base";

export class APICore {
    private modules: Record<string, APIModuleBase> = {};

    public constructor( private baseURL: string ) {
        APIComponent.setAPI( this );
    }

    public getModule( module: APIModuleBaseStatic ) {
        const moduleName = module.getName();

        if ( ! this.modules[ moduleName ] ) {
            throw new Error( `API module ${ moduleName } not registered` );
        }

        return this.modules[ moduleName ];
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

    public register( module: APIModuleBaseStatic ) {

        const moduleName = module.getName();

        if ( this.modules[ moduleName ] ) {
            // TODO: Enable when hot reloading is implemented
            // throw new Error(`API module ${moduleName} already registered`);
        }

        this.modules[ moduleName ] = new module( this );
    }

    public get Component() {
        return APIComponent;
    }
}
