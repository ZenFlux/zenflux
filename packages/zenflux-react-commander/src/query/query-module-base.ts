import { QueryRouterBase } from "@zenflux/react-commander/query/router";

import type { DCommandFunctionComponent } from "@zenflux/react-commander/definitions";
import type { QueryClient } from "@zenflux/react-commander/query/client";
import type { DQueryReadOnlyContext, DQueryEndpointConfig } from "@zenflux/react-commander/query/definitions";

interface Route<TApiResponse, TData> {
    path: string;
    handlers: {
        requestHandler?: ( element: DCommandFunctionComponent, request: Record<string, unknown> ) => Promise<Record<string, unknown>>;
        responseHandler?: ( element: DCommandFunctionComponent, response: Response ) => Promise<TApiResponse>;
        prepareData?: ( apiResponse: TApiResponse ) => TData;
    }
}

class SimpleQueryRouter<TResource extends object> extends QueryRouterBase<TResource, QueryModuleBase<TResource, DQueryReadOnlyContext>> {
    public constructor( api: QueryClient, resource: string, model: QueryModuleBase<TResource, DQueryReadOnlyContext> ) {
        super( api, resource, model );
    }
}

export abstract class QueryModuleBase<TResource extends object = object, TContext extends DQueryReadOnlyContext = DQueryReadOnlyContext> {

    protected api: QueryClient;
    protected router: QueryRouterBase<TResource, QueryModuleBase<TResource, DQueryReadOnlyContext>>;

    private routes: Map<RequestInit["method"], Map<Route<unknown, unknown>["path"], Route<unknown, unknown>>> = new Map();

    public static getName(): string {
        throw new Error( "Please extend QueryModuleBase and implement static getName()" );
    }

    public constructor( api: QueryClient ) {
        this.api = api;
        this.router = new SimpleQueryRouter<TResource>( api, this.getResourceName(), this );
    }

    protected abstract getResourceName(): string;

    public onLoadInternal( context: DQueryReadOnlyContext ) {
        this.load?.( context as TContext );
    }

    public onUnmountInternal( context: DQueryReadOnlyContext, resource: TResource ) {
        this.onUnmount?.( context as TContext, resource );
    }

    public onMountInternal( context: DQueryReadOnlyContext, resource: TResource ) {
        this.onMount?.( context as TContext, resource );
    }

    public onUpdateInternal( context: DQueryReadOnlyContext, state: {
        currentProps: Readonly<Record<string, unknown>>;
        currentState: Readonly<Record<string, unknown>>;
        prevProps: Readonly<Record<string, unknown>>;
        prevState: Readonly<Record<string, unknown>>;
        snapshot: unknown;
    } ) {
        this.onUpdate?.( context as TContext, state );
    }

    public onContextStateUpdatedInternal( context: DQueryReadOnlyContext, hasChanged: boolean ) {
        this.onContextStateUpdated?.( context as TContext, hasChanged );
    }

    public async getData<TData>( element: DCommandFunctionComponent, args?: Record<string, unknown> ): Promise<TData> {
        const componentName = element.getName!();

        const route = this.routes.get( "GET" )?.get( componentName ) as Route<unknown, TData> | undefined;

        if ( ! route ) {
            throw new Error( `Cannot find route for ${ componentName }` );
        }

        const request = await route.handlers.requestHandler!( element, args || {} );

        const queryKey = [ this.getResourceName(), "getData", componentName, JSON.stringify( request ) ] as const;

        const apiResponse = await this.api.cache.fetchQuery( {
            queryKey,
            queryFn: () => this.api.fetch( "GET", route.path, request, ( response ) => {
                return route.handlers.responseHandler!( element, response );
            } )
        } );

        if ( route.handlers.prepareData ) {
            return route.handlers.prepareData( apiResponse );
        }

        return apiResponse as TData;
    }

    protected register( method: string, name: string, route: Route<unknown, unknown> | string ): void {
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

    protected defineEndpoint<TApiResponse, TData>(
        name: string,
        config: DQueryEndpointConfig<TApiResponse, TData>
    ): void {
        const route: Route<TApiResponse, TData> = {
            path: config.path,
            handlers: {
                requestHandler: this.requestHandler.bind( this ),
                responseHandler: this.responseHandler.bind( this ) as ( element: DCommandFunctionComponent, response: Response ) => Promise<TApiResponse>,
                prepareData: config.prepareData,
            }
        };

        this.register( config.method, name, route as Route<unknown, unknown> );
    }

    protected abstract responseHandler( element: DCommandFunctionComponent, response: Response ): Promise<unknown>;

    protected abstract requestHandler( element: DCommandFunctionComponent, request: Record<string, unknown> ): Promise<Record<string, unknown>>;

    protected load?( context: TContext ): void;

    protected onMount?( context: TContext, resource?: TResource ): void;

    protected onUnmount?( context: TContext, resource?: TResource ): void;

    protected onUpdate?( context: TContext, state: {
        currentProps: Readonly<Record<string, unknown>>;
        currentState: Readonly<Record<string, unknown>>;
        prevProps: Readonly<Record<string, unknown>>;
        prevState: Readonly<Record<string, unknown>>;
        snapshot: unknown;
    } ): void;

    protected onContextStateUpdated?( context: TContext, hasChanged: boolean ): void;
}

export abstract class QueryItemModuleBase<TEntity extends object, TContext extends DQueryReadOnlyContext = DQueryReadOnlyContext> extends QueryModuleBase<TEntity, TContext> {
}

export abstract class QueryListModuleBase<TEntity extends object, TContext extends DQueryReadOnlyContext = DQueryReadOnlyContext> extends QueryModuleBase<TEntity[], TContext> {
    protected readonly itemRouter: QueryRouterBase<TEntity, QueryModuleBase<TEntity[], DQueryReadOnlyContext>>;

    protected constructor( api: QueryClient ) {
        super( api );

        class SimpleItemRouter<TEntity2 extends object> extends QueryRouterBase<TEntity2, QueryModuleBase<TEntity2[], DQueryReadOnlyContext>> {
            public constructor( api2: QueryClient, resource: string, model: QueryModuleBase<TEntity2[], DQueryReadOnlyContext> ) {
                super( api2, resource, model );
            }
        }

        this.itemRouter = new SimpleItemRouter<TEntity>( api, this.getResourceName(), this as QueryModuleBase<TEntity[], DQueryReadOnlyContext> );
    }
}

