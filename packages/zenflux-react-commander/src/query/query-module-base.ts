import { QueryRouterBase } from "@zenflux/react-commander/query/router";

import type { DCommandSingleComponentContext, DCommandFunctionComponent } from "@zenflux/react-commander/definitions";
import type { QueryClient } from "@zenflux/react-commander/query/client";
import type { QueryComponent } from "@zenflux/react-commander/query/component";

interface Route {
    path: string;

    handlers: {
        requestHandler?: ( ... args: any[] ) => Promise<any>;
        responseHandler?: ( ... args: any[] ) => Promise<any>;
    }
}

class SimpleQueryRouter<T extends Record<string, unknown>> extends QueryRouterBase<T, QueryModuleBase> {
    public constructor( api: QueryClient, resource: string, model: QueryModuleBase ) { super( api, resource, model ); }
}

// Rename to QueryModelBase
export abstract class QueryModuleBase {

    protected api: QueryClient;
    protected router: QueryRouterBase<Record<string, unknown>, QueryModuleBase>;

    private routes: Map<RequestInit["method"], Map<Route["path"], Route>> = new Map();

    public static getName(): string {
        throw new Error( "Please extend APIModuleBase and implement static getName()" );
    }

    public constructor( api: QueryClient ) {
        this.api = api;
        this.router = new SimpleQueryRouter<Record<string, unknown>>( api, this.getResourceName(), this );
    }

    protected abstract getResourceName(): string;

    public onLoadInternal( component: QueryComponent, context: DCommandSingleComponentContext ) {
        this.load?.( component, context );
    }

    public onUnmountInternal( component: QueryComponent, context: DCommandSingleComponentContext ) {
        this.onUnmount?.( component, context );
    }

    public onMountInternal( component: QueryComponent, context: DCommandSingleComponentContext ) {
        this.onMount?.( component, context );
    }

    public onUpdateInternal( component: QueryComponent, context: DCommandSingleComponentContext, state: any ) {
        this.onUpdate?.( component, context, state );
    }

    public async getProps( element: DCommandFunctionComponent, component: QueryComponent, args?: any ) {
        let componentName: string;

        componentName = element.getName!();

        const route = this.routes.get( "GET" )?.get( componentName );

        if ( ! route ) {
            throw new Error( `Cannot find route for ${ componentName }` );
        }

        const request = await route.handlers.requestHandler!( component, element, args );

        return this.api.fetch( "GET", route.path, request, ( response ) => {
            return route.handlers.responseHandler!( component, element, response );
        } );
    }

    protected register( method: string, name: string, route: Route | string ): void {
        if ( ! this.routes.has( method ) ) {
            this.routes.set( method, new Map() );
        }

        if ( typeof route === "string" ) {
            route = { path: route, handlers: {} };
        }

        if ( ! route.handlers.requestHandler ) {
            route.handlers.requestHandler = this.requestHandler.bind( this );
        }

        if ( ! route.handlers.responseHandler ) {
            route.handlers.responseHandler = this.responseHandler.bind( this );
        }

        this.routes.get( method )!.set( name, route );
    }

    protected abstract responseHandler( component: QueryComponent, element: DCommandFunctionComponent, response: Response ): Promise<any>;

    protected abstract requestHandler( component: QueryComponent, element: DCommandFunctionComponent, request: any ): Promise<any>;

    protected load?( component: QueryComponent, context: DCommandSingleComponentContext ): void;

    protected onMount?( component: QueryComponent, context: DCommandSingleComponentContext ): void;

    protected onUnmount?( component: QueryComponent, context: DCommandSingleComponentContext ): void;

    protected onUpdate?( component: QueryComponent, context: DCommandSingleComponentContext, state: {
        currentProps: any,
        currentState: any,
        prevProps: any,
        prevState: any,
        snapshot: any,
    } ): void;
}

