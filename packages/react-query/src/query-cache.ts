export type QueryCacheKey = readonly unknown[];

export type QueryCache = {
    fetchQuery<T>( options: { queryKey: QueryCacheKey; queryFn: () => Promise<T> } ): Promise<T>;
    prefetchQuery<T>( options: { queryKey: QueryCacheKey; queryFn: () => Promise<T> } ): Promise<void>;
    getQueryData<T>( queryKey: QueryCacheKey ): T | undefined;
    invalidateQueries( options: { queryKey: QueryCacheKey } ): Promise<void>;
};

function serializeKey( key: QueryCacheKey ): string {
    return JSON.stringify( key );
}

function keyStartsWith( key: string, prefix: string ): boolean {
    // Both are JSON arrays; startsWith by string is safe here because we keep exact shapes
    return key.startsWith( prefix.slice( 0, -1 ) );
}

export function queryCreateMemoryCache(): QueryCache {
    const data = new Map<string, unknown>();

    const get = <T>( key: QueryCacheKey ): T | undefined => {
        return data.get( serializeKey( key ) ) as T | undefined;
    };

    const set = ( key: QueryCacheKey, value: unknown ) => {
        data.set( serializeKey( key ), value );
    };

    const fetchQuery = async <T>( options: { queryKey: QueryCacheKey; queryFn: () => Promise<T> } ): Promise<T> => {
        const cached = get<T>( options.queryKey );
        if ( cached !== undefined ) return cached;

        const value = await options.queryFn();
        set( options.queryKey, value );
        return value;
    };

    const prefetchQuery = async <T>( options: { queryKey: QueryCacheKey; queryFn: () => Promise<T> } ): Promise<void> => {
        const cached = get<T>( options.queryKey );
        if ( cached !== undefined ) return;
        const value = await options.queryFn();
        set( options.queryKey, value );
    };

    const getQueryData = <T>( queryKey: QueryCacheKey ): T | undefined => {
        return get<T>( queryKey );
    };

    const invalidateQueries = async ( options: { queryKey: QueryCacheKey } ): Promise<void> => {
        const prefix = serializeKey( options.queryKey );
        for ( const key of Array.from( data.keys() ) ) {
            if ( keyStartsWith( key, prefix ) ) {
                data.delete( key );
            }
        }
    };

    return { fetchQuery, prefetchQuery, getQueryData, invalidateQueries };
}


