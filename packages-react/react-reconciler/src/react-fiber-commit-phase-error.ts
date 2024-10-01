import { SyncLane } from "@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants";

import { WorkTag } from "@zenflux/react-shared/src/react-internal-constants/work-tags";

import { setIsRunningInsertionEffect } from "@zenflux/react-reconciler/src/react-fiber-work-running-insertion-effect";
import { isAlreadyFailedLegacyErrorBoundary } from "@zenflux/react-reconciler/src/react-fiber-work-legacy-error-boundary";
import { createCapturedValueAtFiber } from "@zenflux/react-reconciler/src/react-captured-value";

import { enqueueUpdate } from "@zenflux/react-reconciler/src/react-fiber-class-update-queue";
import { markRootUpdated } from "@zenflux/react-reconciler/src/react-fiber-lane-mark-root";
import { reportUncaughtErrorInDEV } from "@zenflux/react-reconciler/src/react-fiber-commit-work";
import { createClassErrorUpdate, createRootErrorUpdate } from "@zenflux/react-reconciler/src/react-fiber-throw-error-update";
import { ReactFiberRootSchedulerShared } from "@zenflux/react-reconciler/src/react-fiber-root-scheduler-shared";

import type { Fiber, Dispatcher, Lane } from "@zenflux/react-shared/src/react-internal-types";

function captureCommitPhaseErrorOnRoot( rootFiber: Fiber, sourceFiber: Fiber, error: unknown ) {
    const errorInfo = createCapturedValueAtFiber( error, sourceFiber );
    const update = createRootErrorUpdate( rootFiber, errorInfo, ( SyncLane as Lane ) );
    const root = enqueueUpdate( rootFiber, update, ( SyncLane as Lane ) );

    if ( root !== null ) {
        markRootUpdated( root, SyncLane );
        ReactFiberRootSchedulerShared.ensureRootScheduled( root );
    }
}

export function safelyCallDestroy( current: Fiber, nearestMountedAncestor: Fiber | null, destroy: ReturnType<Parameters<Dispatcher["useEffect"]>[0]> ) {
    try {
        ( destroy as any )();
    } catch ( error ) {
        captureCommitPhaseError( current, nearestMountedAncestor, error );
    }
}

export function captureCommitPhaseError( sourceFiber: Fiber, nearestMountedAncestor: Fiber | null, error: unknown ) {
    if ( __DEV__ ) {
        reportUncaughtErrorInDEV( error );
        setIsRunningInsertionEffect( false );
    }

    if ( sourceFiber.tag === WorkTag.HostRoot ) {
        // Error was thrown at the root. There is no parent, so the root
        // itself should capture it.
        captureCommitPhaseErrorOnRoot( sourceFiber, sourceFiber, error );
        return;
    }

    let fiber = nearestMountedAncestor;

    while ( fiber !== null ) {
        if ( fiber.tag === WorkTag.HostRoot ) {
            captureCommitPhaseErrorOnRoot( fiber, sourceFiber, error );
            return;
        } else if ( fiber.tag === WorkTag.ClassComponent ) {
            const ctor = fiber.type;
            const instance = fiber.stateNode;

            if ( typeof ctor.getDerivedStateFromError === "function" || typeof instance.componentDidCatch === "function" && ! isAlreadyFailedLegacyErrorBoundary( instance ) ) {
                const errorInfo = createCapturedValueAtFiber( error, sourceFiber );
                const update = createClassErrorUpdate( fiber, errorInfo, ( SyncLane as Lane ) );
                const root = enqueueUpdate( fiber, update, ( SyncLane as Lane ) );

                if ( root !== null ) {
                    markRootUpdated( root, SyncLane );
                    ReactFiberRootSchedulerShared.ensureRootScheduled( root );
                }

                return;
            }
        }

        fiber = fiber.return;
    }

    if ( __DEV__ ) {
        console.error( "Internal React error: Attempted to capture a commit phase error " + "inside a detached tree. This indicates a bug in React. Potential " + "causes include deleting the same fiber more than once, committing an " + "already-finished tree, or an inconsistent return pointer.\n\n" + "Error message:\n\n%s", error );
    }
}
