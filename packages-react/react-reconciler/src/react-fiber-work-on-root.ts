import { enableProfilerNestedUpdatePhase, enableProfilerTimer } from "@zenflux/react-shared/src/react-feature-flags";

import { LegacyRoot } from "@zenflux/react-shared/src/react-internal-constants/root-tags";

import {
    includesSyncLane,
    NoLane,
    NoLanes
} from "@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants";

import { markRootSuspended } from "@zenflux/react-reconciler/src/react-fiber-lane-mark-root";
import { ReactFiberRootSchedulerShared } from "@zenflux/react-reconciler/src/react-fiber-root-scheduler-shared";
import {
    isExecutionContextRenderOrCommitDeactivate
} from "@zenflux/react-reconciler/src/react-fiber-work-excution-context";
import {
    getWorkInProgressDeferredLane,
    getWorkInProgressRoot,
    getWorkInProgressRootFatalError,
    getWorkInProgressRootRecoverableErrors,
    getWorkInProgressRootRenderLanes,
    getWorkInProgressTransitions,
} from "@zenflux/react-reconciler/src/react-fiber-work-in-progress";
import {
    prepareWorkInProgressFreshStack
} from "@zenflux/react-reconciler/src/react-fiber-work-in-progress-prepare-fresh-stack";
import { commitRoot } from "@zenflux/react-reconciler/src/react-fiber-work-on-root-commit";
import { recoverFromConcurrentError } from "@zenflux/react-reconciler/src/react-fiber-work-on-root-concurrent-recover";
import { renderRootSync } from "@zenflux/react-reconciler/src/react-fiber-work-on-root-render-root";
import { flushPassiveEffects } from "@zenflux/react-reconciler/src/react-fiber-work-passive-effects";
import { getLanesToRetrySynchronouslyOnError, getNextLanes, } from "@zenflux/react-reconciler/src/react-fiber-lane";

import { syncNestedUpdateFlag } from "@zenflux/react-reconciler/src/react-profile-timer";
import { ReactFiberWorkOnRootShared } from "@zenflux/react-reconciler/src/react-fiber-work-on-root-shared";
import { RootExitStatus } from "@zenflux/react-reconciler/src/root-exit-status";

import type { Fiber, FiberRoot, Lanes } from "@zenflux/react-shared/src/react-internal-types";

// --- Find Better Solution ---
type FlushSyncWorkOnAllRootsCallback = typeof flushSyncWorkOnAllRoots;
type FlushSyncWorkOnLegacyRootsOnlyCallback = typeof flushSyncWorkOnLegacyRootsOnly;

export type {
    FlushSyncWorkOnAllRootsCallback,
    FlushSyncWorkOnLegacyRootsOnlyCallback,
};

ReactFiberWorkOnRootShared.flushSyncWorkOnAllRoots = flushSyncWorkOnAllRoots;
ReactFiberWorkOnRootShared.flushSyncWorkOnLegacyRootsOnly = flushSyncWorkOnLegacyRootsOnly;
// ---

// This is the entry point for synchronous tasks that don't go
// through Scheduler
function performSyncWorkOnRoot( root: FiberRoot, lanes: Lanes ): null {
    if ( isExecutionContextRenderOrCommitDeactivate() ) {
        throw new Error( "Should not already be working." );
    }

    const didFlushPassiveEffects = flushPassiveEffects();

    if ( didFlushPassiveEffects ) {
        // If passive effects were flushed, exit to the outer work loop in the root
        // scheduler, so we can recompute the priority.
        // TODO: We don't actually need this `ensureRootIsScheduled` call because
        // this path is only reachable if the root is already part of the schedule.
        // I'm including it only for consistency with the other exit points from
        // this function. Can address in a subsequent refactor.
        ReactFiberRootSchedulerShared.ensureRootScheduled( root );
        return null;
    }

    if ( enableProfilerTimer && enableProfilerNestedUpdatePhase ) {
        syncNestedUpdateFlag();
    }

    // Next calls will set `root.current.subtreeFlags`
    let exitStatus = renderRootSync( root, lanes );

    if ( root.tag !== LegacyRoot && exitStatus === RootExitStatus.RootErrored ) {
        // If something threw an error, try rendering one more time. We'll render
        // synchronously to block concurrent data mutations, and we'll includes
        // all pending updates are included. If it still fails after the second
        // attempt, we'll give up and commit the resulting tree.
        const originallyAttemptedLanes = lanes;
        const errorRetryLanes = getLanesToRetrySynchronouslyOnError( root, originallyAttemptedLanes );

        if ( errorRetryLanes !== NoLanes ) {
            lanes = errorRetryLanes;
            exitStatus = recoverFromConcurrentError( root, originallyAttemptedLanes, errorRetryLanes );
        }
    }

    if ( exitStatus === RootExitStatus.RootFatalErrored ) {
        const fatalError = getWorkInProgressRootFatalError();
        prepareWorkInProgressFreshStack( root, NoLanes );
        markRootSuspended( root, lanes, NoLane );
        ReactFiberRootSchedulerShared.ensureRootScheduled( root );
        throw fatalError;
    }

    if ( exitStatus === RootExitStatus.RootDidNotComplete ) {
        // The render unwound without completing the tree. This happens in special
        // cases where need to exit the current render without producing a
        // consistent tree or committing.
        markRootSuspended( root, lanes, NoLane );
        ReactFiberRootSchedulerShared.ensureRootScheduled( root );
        return null;
    }

    // We now have a consistent tree. Because this is a sync render, we
    // will commit it even if something suspended.
    const finishedWork: Fiber = ( root.current.alternate as any );
    root.finishedWork = finishedWork;
    root.finishedLanes = lanes;

    commitRoot(
        root,
        getWorkInProgressRootRecoverableErrors(),
        getWorkInProgressTransitions(),
        getWorkInProgressDeferredLane()
    );

    // Before exiting, make sure there's a callback scheduled for the next
    // pending level.
    ReactFiberRootSchedulerShared.ensureRootScheduled( root );
    return null;
}

function flushSyncWorkOnAllRoots() {
    // This is allowed to be called synchronously, but the caller should check
    // the execution context first.
    flushSyncWorkAcrossRoots_impl( false );
}

function flushSyncWorkOnLegacyRootsOnly() {
    // This is allowed to be called synchronously, but the caller should check
    // the execution context first.
    flushSyncWorkAcrossRoots_impl( true );
}

function throwError( error: unknown ) {
    throw error;
}

function flushSyncWorkAcrossRoots_impl( onlyLegacy: boolean ) {
    if ( ReactFiberWorkOnRootShared.isFlushingWork() ) {
        // Prevent reentrancy.
        // TODO: Is this overly defensive? The callers must check the execution
        // context first regardless.
        return;
    }

    if ( ! ReactFiberWorkOnRootShared.hasPendingSyncWork() ) {
        // Fast path. There's no sync work to do.
        return;
    }

    // There may or may not be synchronous work scheduled. Let's check.
    let didPerformSomeWork;
    let errors: Array<unknown> | null = null;

    ReactFiberWorkOnRootShared.setIsFlushingOnWork();

    do {
        didPerformSomeWork = false;
        let root = ReactFiberRootSchedulerShared.firstScheduledRoot;

        while ( root !== null ) {
            if ( onlyLegacy && root.tag !== LegacyRoot ) {// Skip non-legacy roots.
            } else {
                const workInProgressRoot = getWorkInProgressRoot();
                const workInProgressRootRenderLanes = getWorkInProgressRootRenderLanes();
                const nextLanes = getNextLanes( root, root === workInProgressRoot ? workInProgressRootRenderLanes : NoLanes );

                if ( includesSyncLane( nextLanes ) ) {
                    // This root has pending sync work. Flush it now.
                    try {
                        didPerformSomeWork = true;
                        performSyncWorkOnRoot( root, nextLanes );
                    } catch ( error ) {
                        // Collect errors so we can rethrow them at the end
                        if ( errors === null ) {
                            errors = [ error ];
                        } else {
                            errors.push( error );
                        }
                    }
                }
            }

            root = root.next;
        }
    } while ( didPerformSomeWork );

    ReactFiberWorkOnRootShared.unsetIsFlushingOnWork();

    // If any errors were thrown, rethrow them right before exiting.
    // TODO: Consider returning these to the caller, to allow them to decide
    // how/when to rethrow.
    if ( errors !== null ) {
        if ( errors.length > 1 ) {
            if ( typeof AggregateError === "function" ) {

                throw new AggregateError( errors );
            } else {
                for ( let i = 1 ; i < errors.length ; i++ ) {
                    ReactFiberRootSchedulerShared.scheduleImmediateTask( throwError.bind( null, errors[ i ] ) );
                }

                throw errors[ 0 ];
            }
        } else {
            throw errors[ 0 ];
        }
    }
}
