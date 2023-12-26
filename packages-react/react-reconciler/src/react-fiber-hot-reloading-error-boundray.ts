import { isRefreshHandler } from "@zenflux/react-reconciler/src/react-fiber-hot-reloading-resvole";

import type { Fiber } from "@zenflux/react-shared/src/react-internal-types";

let failedBoundaries: WeakSet<Fiber> | null = null;

export function hasFailedErrorBoundary() {
    return failedBoundaries !== null;
}

export function hasSpecificFailedErrorBoundarySafe( fiber: Fiber ) {
    return failedBoundaries!.has( fiber );
}

export function markFailedErrorBoundaryForHotReloading( fiber: Fiber ) {
    if ( __DEV__ ) {
        if ( ! isRefreshHandler() ) {
            // Hot reloading is disabled.
            return;
        }

        if ( typeof WeakSet !== "function" ) {
            return;
        }

        if ( failedBoundaries === null ) {
            failedBoundaries = new WeakSet();
        }

        failedBoundaries.add( fiber );
    }
}
