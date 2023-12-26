import { enableCache, enableLegacyCache } from "@zenflux/react-shared/src/react-feature-flags";

import { WorkTag } from "@zenflux/react-shared/src/react-internal-constants/work-tags";

import { ReactFiberHooksCurrent } from "@zenflux/react-reconciler/src/react-fiber-hooks-shared";

import { requestUpdateLane } from "@zenflux/react-reconciler/src/react-fiber-work-in-progress-request-lane";
import {
    createUpdate as createLegacyQueueUpdate,
    enqueueUpdate as enqueueLegacyQueueUpdate,
    entangleTransitions as entangleLegacyQueueTransitions
} from "@zenflux/react-reconciler/src/react-fiber-class-update-queue";
import { scheduleUpdateOnFiber } from "@zenflux/react-reconciler/src/react-fiber-work-schedule-update";
import { createCache } from "@zenflux/react-reconciler/src/react-fiber-cache-component";
import {
    mountWorkInProgressHook,
    updateWorkInProgressHook
} from "@zenflux/react-reconciler/src/react-fiber-hooks-infra";

import type { Fiber } from "@zenflux/react-shared/src/react-internal-types";

export function mountRefresh(): any {
    const hook = mountWorkInProgressHook();
    const refresh = hook.memoizedState = refreshCache.bind( null, ReactFiberHooksCurrent.renderingFiber );
    return refresh;
}

export function updateRefresh(): any {
    const hook = updateWorkInProgressHook();
    return hook.memoizedState;
}

function refreshCache<T>( fiber: Fiber, seedKey: ( () => T ) | null | undefined, seedValue: T ): void {
    if ( ! enableCache ) {
        return;
    }

    // TODO: Does Cache work in legacy mode? Should decide and write a test.
    // TODO: Consider warning if the refresh is at discrete priority, or if we
    // otherwise suspect that it wasn't batched properly.
    let provider = fiber.return;

    while ( provider !== null ) {
        switch ( provider.tag ) {
            case WorkTag.CacheComponent:
            case WorkTag.HostRoot: {
                // Schedule an update on the cache boundary to trigger a refresh.
                const lane = requestUpdateLane( provider );
                const refreshUpdate = createLegacyQueueUpdate( lane );
                const root = enqueueLegacyQueueUpdate( provider, refreshUpdate, lane );

                if ( root !== null ) {
                    scheduleUpdateOnFiber( root, provider, lane );
                    entangleLegacyQueueTransitions( root, provider, lane );
                }

                // TODO: If a refresh never commits, the new cache created here must be
                // released. A simple case is start refreshing a cache boundary, but then
                // unmount that boundary before the refresh completes.
                const seededCache = createCache();

                if ( seedKey !== null && seedKey !== undefined && root !== null ) {
                    if ( enableLegacyCache ) {
                        // Seed the cache with the value passed by the caller. This could be
                        // from a server mutation, or it could be a streaming response.
                        seededCache.data.set( seedKey, seedValue );
                    } else {
                        if ( __DEV__ ) {
                            console.error( "The seed argument is not enabled outside experimental channels." );
                        }
                    }
                }

                const payload = {
                    cache: seededCache
                };
                refreshUpdate.payload = payload;
                return;
            }
        }

        provider = provider.return;
    } // TODO: Warn if unmounted?

}
