import type { QueryClient } from "@zenflux/react-query/src/query-client";

export interface QueryModel {
}

export abstract class QueryRouterBase<Resource, Model extends QueryModel = QueryModel> {

    protected readonly api: QueryClient;
    protected readonly resource: string;
    protected readonly model: Model;

    private listCache?: Promise<Resource[]>;
    private itemCache: Map<string, Promise<Resource>> = new Map();

    public constructor( api: QueryClient, resource: string, model: Model ) {
        this.api = api;
        this.resource = resource;
        this.model = model;
    }

    protected fetchList = async (): Promise<Resource[]> => {
        return this.api.fetch( "GET", `v1/${ this.resource }`, {}, ( r ) => r.json() );
    };

    protected fetchItem = async ( key: string ): Promise<Resource> => {
        return this.api.fetch( "GET", `v1/${ this.resource }/:key`, { key }, ( r ) => r.json() );
    };

    protected saveItem = async ( input: Resource & { key: string } ): Promise<void> => {
        await this.api.fetch( "POST", `v1/${ this.resource }/:key`, input as unknown as Record<string, unknown>, ( r ) => r.json() );
    };

    protected deleteItem = async ( key: string ): Promise<void> => {
        await this.api.fetch( "DELETE", `v1/${ this.resource }/${ key }`, {}, ( r ) => r.json() );
    };

    protected queryKeyList(): readonly unknown[] {
        return [ this.resource, "list" ] as const;
    }

    protected queryKeyItem( key: string ): readonly unknown[] {
        return [ this.resource, "item", key ] as const;
    }

    public async list(): Promise<Resource[]> {
        return this.api.tanstack.fetchQuery( {
            queryKey: this.queryKeyList(),
            queryFn: this.fetchList,
        } );
    }

    public async item( key: string ): Promise<Resource> {
        return this.api.tanstack.fetchQuery( {
            queryKey: this.queryKeyItem( key ),
            queryFn: () => this.fetchItem( key ),
        } );
    }

    public async save( input: Resource & { key: string } ): Promise<void> {
        await this.saveItem( input );
        await this.api.tanstack.invalidateQueries( { queryKey: [ this.resource ] } );
    }

    public async remove( key: string ): Promise<void> {
        await this.deleteItem( key );
        await this.api.tanstack.invalidateQueries( { queryKey: [ this.resource ] } );
    }

    protected invalidate( key?: string ) {
        this.listCache = undefined;
        if ( key ) this.itemCache.delete( key );
    }

    public async queryPrefetchItem( key: string ): Promise<void> {
        await this.api.tanstack.prefetchQuery( {
            queryKey: this.queryKeyItem( key ),
            queryFn: () => this.fetchItem( key ),
        } );
    }

    public queryGetCachedItem( key: string ): Resource | undefined {
        return this.api.tanstack.getQueryData( this.queryKeyItem( key ) ) as Resource | undefined;
    }
}

