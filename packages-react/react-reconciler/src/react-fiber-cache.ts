import { enableCache } from "@zenflux/react-shared/src/react-feature-flags";

import { CacheContext } from "@zenflux/react-reconciler/src/react-fiber-cache-component";

import { readContext } from "@zenflux/react-reconciler/src/react-fiber-new-context";

import type { Cache, CacheDispatcher } from "@zenflux/react-shared/src/react-internal-types";

function getCacheSignal(): AbortSignal {
    if ( ! enableCache ) {
        throw new Error( "Not implemented." );
    }

    const cache: Cache = readContext( CacheContext );
    return cache.controller.signal;
}

function getCacheForType<T>( resourceType: () => T ): T {
    if ( ! enableCache ) {
        throw new Error( "Not implemented." );
    }

    const cache: Cache = readContext( CacheContext );
    let cacheForType: T = ( cache.data.get( resourceType ) as any );

    if ( cacheForType === undefined ) {
        cacheForType = resourceType();
        cache.data.set( resourceType, cacheForType );
    }

    return cacheForType;
}

export const DefaultCacheDispatcher: CacheDispatcher = {
    getCacheSignal,
    getCacheForType
};
