import { enableCache } from "@zenflux/react-shared/src/react-feature-flags";

import { popProvider, pushProvider } from "@zenflux/react-reconciler/src/react-fiber-new-context";

import { CacheContext } from "@zenflux/react-reconciler/src/react-fiber-cache-component";

import type { Fiber, Cache } from "@zenflux/react-shared/src/react-internal-types";

export function pushCacheProvider( workInProgress: Fiber, cache: Cache ) {
    if ( ! enableCache ) {
        return;
    }

    pushProvider( workInProgress, CacheContext, cache );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function popCacheProvider( workInProgress: Fiber, cache: Cache ) {
    if ( ! enableCache ) {
        return;
    }

    popProvider( CacheContext, workInProgress );
}
