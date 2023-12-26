import { enableCache } from "@zenflux/react-shared/src/react-feature-flags";

import { NoLanes } from "@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants";

import { releaseCache } from "@zenflux/react-reconciler/src/react-fiber-cache-component";

import type { FiberRoot, Lanes } from "@zenflux/react-shared/src/react-internal-types";

export function reactReleaseRootPooledCache( root: FiberRoot, remainingLanes: Lanes ) {
    if ( enableCache ) {
        const pooledCacheLanes = root.pooledCacheLanes &= remainingLanes;

        if ( pooledCacheLanes === NoLanes ) {
            // None of the remaining work relies on the cache pool. Clear it so
            // subsequent requests get a new cache
            const pooledCache = root.pooledCache;

            if ( pooledCache != null ) {
                root.pooledCache = null;
                releaseCache( pooledCache );
            }
        }
    }
}
