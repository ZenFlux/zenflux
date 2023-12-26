import { NoLane, SyncLane } from "@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants";

import { TypeOfMode } from "@zenflux/react-shared/src/react-internal-constants/type-of-mode";

import { markRootUpdated } from "@zenflux/react-reconciler/src/react-fiber-lane-mark-root";
import { ReactFiberRootSchedulerShared } from "@zenflux/react-reconciler/src/react-fiber-root-scheduler-shared";

import { enqueueConcurrentRenderForLane } from "@zenflux/react-reconciler/src/react-fiber-concurrent-updates";
import { claimNextRetryLane } from "@zenflux/react-reconciler/src/react-fiber-lane";

import type { SuspenseState } from "@zenflux/react-reconciler/src/react-fiber-suspense-component";
import type { Fiber, Lane } from "@zenflux/react-shared/src/react-internal-types";

function requestRetryLane( fiber: Fiber ) {
    // This is a fork of `requestUpdateLane` designed specifically for Suspense
    // "retries" — a special update that attempts to flip a Suspense boundary
    // from its placeholder state to its primary/resolved state.
    // Special cases
    const mode = fiber.mode;

    if ( ( mode & TypeOfMode.ConcurrentMode ) === TypeOfMode.NoMode ) {
        return ( SyncLane as Lane );
    }

    return claimNextRetryLane();
}

export function retryTimedOutBoundary( boundaryFiber: Fiber, retryLane: Lane ) {
    // The boundary fiber (a Suspense component or SuspenseList component)
    // previously was rendered in its fallback state. One of the promises that
    // suspended it has resolved, which means at least part of the tree was
    // likely unblocked. Try rendering again, at a new lanes.
    if ( retryLane === NoLane ) {
        // TODO: Assign this to `suspenseState.retryLane`? to avoid
        // unnecessary entanglement?
        retryLane = requestRetryLane( boundaryFiber );
    }

    // TODO: Special case idle priority?
    const root = enqueueConcurrentRenderForLane( boundaryFiber, retryLane );

    if ( root !== null ) {
        markRootUpdated( root, retryLane );
        ReactFiberRootSchedulerShared.ensureRootScheduled( root );
    }
}

export function retryDehydratedSuspenseBoundary( boundaryFiber: Fiber ) {
    const suspenseState: null | SuspenseState = boundaryFiber.memoizedState;
    let retryLane = NoLane;

    if ( suspenseState !== null ) {
        retryLane = suspenseState.retryLane;
    }

    retryTimedOutBoundary( boundaryFiber, retryLane );
}
