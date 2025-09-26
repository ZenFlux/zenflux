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

    public async list(): Promise<Resource[]> {
        if ( ! this.listCache ) this.listCache = this.fetchList();
        return this.listCache;
    }

    public async item( key: string ): Promise<Resource> {
        let cached = this.itemCache.get( key );
        if ( ! cached ) {
            cached = this.fetchItem( key );
            this.itemCache.set( key, cached );
        }
        return cached;
    }

    public async save( input: Resource & { key: string } ): Promise<void> {
        await this.saveItem( input );
        this.invalidate( input.key );
    }

    public async remove( key: string ): Promise<void> {
        await this.deleteItem( key );
        this.invalidate( key );
    }

    protected invalidate( key?: string ) {
        this.listCache = undefined;
        if ( key ) this.itemCache.delete( key );
    }
}

