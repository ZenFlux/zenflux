import * as Scheduler from "@zenflux/react-scheduler";

import { unstable_now as now } from "@zenflux/react-scheduler";
import {
    alwaysThrottleRetries,
    disableSchedulerTimeoutInWorkLoop,
    enableDebugTracing,
    enableProfilerNestedUpdatePhase,
    enableProfilerTimer,
    enableSchedulingProfiler,
    enableUpdaterTracking
} from "@zenflux/react-shared/src/react-feature-flags";
import ReactSharedInternals from "@zenflux/react-shared/src/react-shared-internals";

import {
    includesBlockingLane, includesExpiredLane, includesOnlyRetries, includesOnlyTransitions,
    NoLane,
    NoLanes
} from "@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants";

import { WorkTag } from "@zenflux/react-shared/src/react-internal-constants/work-tags";

import { logRenderStarted, logRenderStopped } from "@zenflux/react-reconciler/src/react-debug-tracing";
import { restorePendingUpdaters } from "@zenflux/react-reconciler/src/react-fiber-commit-work";
import { finishQueueingConcurrentUpdates } from "@zenflux/react-reconciler/src/react-fiber-concurrent-updates";
import {
    isDevToolsPresent,
    markRenderStarted,
    markRenderStopped,
    markRenderYielded
} from "@zenflux/react-reconciler/src/react-fiber-dev-tools-hook";
import {
    getLanesToRetrySynchronouslyOnError,
    getNextLanes,
    getTransitionsForLanes,
    movePendingFibersToMemoized
} from "@zenflux/react-reconciler/src/react-fiber-lane";

import { markRootSuspended } from "@zenflux/react-reconciler/src/react-fiber-lane-mark-root";
import { resetContextDependencies } from "@zenflux/react-reconciler/src/react-fiber-new-context";
import { ReactFiberRootSchedulerShared } from "@zenflux/react-reconciler/src/react-fiber-root-scheduler-shared";
import { isThenableResolved } from "@zenflux/react-reconciler/src/react-fiber-thenable";
import {
    activateRenderExecutionContext,
    getExecutionContext,
    isExecutionContextRenderOrCommitDeactivate,
    setExecutionContext
} from "@zenflux/react-reconciler/src/react-fiber-work-excution-context";
import {
    getWorkInProgress,
    getWorkInProgressDeferredLane,
    getWorkInProgressRoot,
    getWorkInProgressRootExitStatus,
    getWorkInProgressRootFatalError,
    getWorkInProgressRootRecoverableErrors,
    getWorkInProgressRootRenderLanes,
    getWorkInProgressSafe,
    getWorkInProgressSuspendedReason,
    getWorkInProgressThrownValue,
    getWorkInProgressTransitions,
    resetWorkInProgressRootRenderTimer,
    setWorkInProgress,
    setWorkInProgressRoot,
    setWorkInProgressRootExitStatus,
    setWorkInProgressRootRenderLanes,
    setWorkInProgressSuspendedReason,
    setWorkInProgressThrownValue,
    setWorkInProgressTransitions
} from "@zenflux/react-reconciler/src/react-fiber-work-in-progress";
import { resetWorkInProgressStack } from "@zenflux/react-reconciler/src/react-fiber-work-in-progress-ex";
import {
    prepareWorkInProgressFreshStack
} from "@zenflux/react-reconciler/src/react-fiber-work-in-progress-prepare-fresh-stack";
import {
    getTimeMostRecentFallbackThrottleEnd
} from "@zenflux/react-reconciler/src/react-fiber-work-most-recent-fallback-time";

import { commitRoot, commitRootWhenReady } from "@zenflux/react-reconciler/src/react-fiber-work-on-root-commit";
import { recoverFromConcurrentError } from "@zenflux/react-reconciler/src/react-fiber-work-on-root-concurrent-recover";
import {
    popCacheDispatcher,
    popDispatcher,
    pushCacheDispatcher,
    pushDispatcher
} from "@zenflux/react-reconciler/src/react-fiber-work-on-root-dispatcher";
import { handleThrow } from "@zenflux/react-reconciler/src/react-fiber-work-on-root-handle-throw";
import {
    completeUnitOfWork,
    performUnitOfWork,
    replaySuspendedUnitOfWork,
    throwAndUnwindWorkLoop,
    workLoopSync
} from "@zenflux/react-reconciler/src/react-fiber-work-on-root-loop";
import { renderRootSync } from "@zenflux/react-reconciler/src/react-fiber-work-on-root-render-root";
import { flushPassiveEffects } from "@zenflux/react-reconciler/src/react-fiber-work-passive-effects";
import { isRenderConsistentWithExternalStores } from "@zenflux/react-reconciler/src/react-fiber-work-render-consistent";
import { resetNestedUpdateFlag } from "@zenflux/react-reconciler/src/react-profile-timer";

import { SuspendedReason } from "@zenflux/react-reconciler/src/react-suspended-reason";
import { RootExitStatus } from "@zenflux/react-reconciler/src/root-exit-status";

import type { Fiber, FiberRoot, Lanes } from "@zenflux/react-shared/src/react-internal-types";
import type { SchedulerCallback } from "@zenflux/react-scheduler";
import type { Thenable } from "@zenflux/react-shared/src/react-types";

const {
    scheduleTimeout,
    preloadInstance,
} = globalThis.__RECONCILER__CONFIG__;

const {
    ReactCurrentActQueue,
} = ReactSharedInternals;

function shouldForceFlushFallbacksInDEV() {
    // Never force flush in production. This function should get stripped out.
    return __DEV__ && ReactCurrentActQueue.current !== null;
}

function finishConcurrentRender( root: FiberRoot, exitStatus: RootExitStatus, finishedWork: Fiber, lanes: Lanes ) {
    // TODO: The fact that most of these branches are identical suggests that some
    // of the exit statuses are not best modeled as exit statuses and should be
    // tracked orthogonally.
    switch ( exitStatus ) {
        case RootExitStatus.RootInProgress:
        case RootExitStatus.RootFatalErrored: {
            throw new Error( "Root did not complete. This is a bug in React." );
        }

        case RootExitStatus.RootSuspendedWithDelay: {
            if ( includesOnlyTransitions( lanes ) ) {
                // This is a transition, so we should exit without committing a
                // placeholder and without scheduling a timeout. Delay indefinitely
                // until we receive more data.
                markRootSuspended( root, lanes, getWorkInProgressDeferredLane() );
                return;
            }

            // Commit the placeholder.
            break;
        }

        case RootExitStatus.RootErrored:
        case RootExitStatus.RootSuspended:
        case RootExitStatus.RootCompleted: {
            break;
        }

        default: {
            throw new Error( "Unknown root exit status." );
        }
    }

    if ( shouldForceFlushFallbacksInDEV() ) {
        // We're inside an `act` scope. Commit immediately.
        commitRoot(
            root,
            getWorkInProgressRootRecoverableErrors(),
            getWorkInProgressTransitions(),
            getWorkInProgressDeferredLane()
        );
    } else {
        if ( includesOnlyRetries( lanes ) && ( alwaysThrottleRetries || exitStatus === RootExitStatus.RootSuspended ) ) {
            // This render only included retries, no updates. Throttle committing
            // retries so that we don't show too many loading states too quickly.
            const msUntilTimeout = getTimeMostRecentFallbackThrottleEnd();

            // Don't bother with a very short suspense time.
            if ( msUntilTimeout > 10 ) {
                markRootSuspended( root, lanes, getWorkInProgressDeferredLane() );
                const nextLanes = getNextLanes( root, NoLanes );

                if ( nextLanes !== NoLanes ) {
                    // There's additional work we can do on this root. We might as well
                    // attempt to work on that while we're suspended.
                    return;
                }

                // The render is suspended, it hasn't timed out, and there's no
                // lower priority work to do. Instead of committing the fallback
                // immediately, wait for more data to arrive.
                // TODO: Combine retry throttling with Suspensey commits. Right now they
                // run one after the other.
                root.timeoutHandle = scheduleTimeout(
                    commitRootWhenReady.bind(
                        null,
                        root,
                        finishedWork,
                        getWorkInProgressRootRecoverableErrors(),
                        getWorkInProgressTransitions(),
                        lanes,
                        getWorkInProgressDeferredLane()
                    ), msUntilTimeout );
                return;
            }
        }

        commitRootWhenReady(
            root,
            finishedWork,
            getWorkInProgressRootRecoverableErrors(),
            getWorkInProgressTransitions(),
            lanes,
            getWorkInProgressDeferredLane()
        );
    }
}

// This is the entry point for every concurrent task, i.e. anything that
// goes through Scheduler.
export function performConcurrentWorkOnRoot( root: FiberRoot, didTimeout?: boolean ): SchedulerCallback | null {
    if ( enableProfilerTimer && enableProfilerNestedUpdatePhase ) {
        resetNestedUpdateFlag();
    }

    if ( isExecutionContextRenderOrCommitDeactivate() ) {
        throw new Error( "Should not already be working." );
    }

    // Flush any pending passive effects before deciding which lanes to work on,
    // in case they schedule additional work.
    const originalCallbackNode = root.callbackNode;
    const didFlushPassiveEffects = flushPassiveEffects();

    if ( didFlushPassiveEffects ) {
        // Something in the passive effect phase may have canceled the current task.
        // Check if the task node for this root was changed.
        if ( root.callbackNode !== originalCallbackNode ) {
            // The current task was canceled. Exit. We don't need to call
            // `ensureRootIsScheduled` because the check above implies either that
            // there's a new task, or that there's no remaining work on this root.
            return null;
        } else {// Current task was not canceled. Continue.
        }
    }

    // Determine the next lanes to work on, using the fields stored
    // on the root.
    // TODO: This was already computed in the caller. Pass it as an argument.
    let lanes = getNextLanes(
        root,
        root === getWorkInProgressRoot() ? getWorkInProgressRootRenderLanes() : NoLanes
    );

    if ( lanes === NoLanes ) {
        // Defensive coding. This is never expected to happen.
        return null;
    }

    // We disable time-slicing in some cases: if the work has been CPU-bound
    // for too long ("expired" work, to prevent starvation), or we're in
    // sync-updates-by-default mode.
    // TODO: We only check `didTimeout` defensively, to account for a Scheduler
    // bug we're still investigating. Once the bug in Scheduler is fixed,
    // we can remove this, since we track expiration ourselves.
    const shouldTimeSlice =
        ! includesBlockingLane( root, lanes ) &&
        ! includesExpiredLane( root, lanes ) &&
        ( disableSchedulerTimeoutInWorkLoop || ! didTimeout );

    let exitStatus = shouldTimeSlice ?
        renderRootConcurrent( root, lanes ) :
        renderRootSync( root, lanes );

    if ( exitStatus !== RootExitStatus.RootInProgress ) {
        let renderWasConcurrent = shouldTimeSlice;

        do {
            if ( exitStatus === RootExitStatus.RootDidNotComplete ) {
                // The render unwound without completing the tree. This happens in special
                // cases where need to exit the current render without producing a
                // consistent tree or committing.
                markRootSuspended( root, lanes, NoLane );
            } else {
                // The render completed.
                // Check if this render may have yielded to a concurrent event, and if so,
                // confirm that any newly rendered stores are consistent.
                // TODO: It's possible that even a concurrent render may never have yielded
                // to the main thread, if it was fast enough, or if it expired. We could
                // skip the consistency check in that case, too.
                const finishedWork: Fiber = ( root.current.alternate as any );

                if ( renderWasConcurrent && ! isRenderConsistentWithExternalStores( finishedWork ) ) {
                    // A store was mutated in an interleaved event. Render again,
                    // synchronously, to block further mutations.
                    exitStatus = renderRootSync( root, lanes );
                    // We assume the tree is now consistent because we didn't yield to any
                    // concurrent events.
                    renderWasConcurrent = false;
                    // Need to check the exit status again.
                    continue;
                }

                // Check if something threw
                if ( exitStatus === RootExitStatus.RootErrored ) {
                    const originallyAttemptedLanes = lanes;
                    const errorRetryLanes =
                        getLanesToRetrySynchronouslyOnError( root, originallyAttemptedLanes );

                    if ( errorRetryLanes !== NoLanes ) {
                        lanes = errorRetryLanes;
                        exitStatus = recoverFromConcurrentError(
                            root,
                            originallyAttemptedLanes,
                            errorRetryLanes
                        );
                        renderWasConcurrent = false;
                    }
                }

                if ( exitStatus === RootExitStatus.RootFatalErrored ) {
                    const fatalError = getWorkInProgressRootFatalError();
                    prepareWorkInProgressFreshStack( root, NoLanes );
                    markRootSuspended( root, lanes, NoLane );
                    ReactFiberRootSchedulerShared.ensureRootScheduled( root );
                    throw fatalError;
                }

                // We now have a consistent tree. The next step is either to commit it,
                // or, if something suspended, wait to commit it after a timeout.
                root.finishedWork = finishedWork;
                root.finishedLanes = lanes;
                finishConcurrentRender( root, exitStatus, finishedWork, lanes );
            }

            break;
        } while ( true );
    }

    ReactFiberRootSchedulerShared.ensureRootScheduled( root );

    return getContinuationForRoot( root, originalCallbackNode );
}

// The work loop is an extremely hot path. Tell Closure not to inline it.

/** @noinline */
function workLoopConcurrent() {
    // Perform work until Scheduler asks us to yield
    while ( getWorkInProgress() !== null && ! Scheduler.unstable_shouldYield() ) {
        // $FlowFixMe[incompatible-call] found when upgrading Flow
        performUnitOfWork( getWorkInProgressSafe() );
    }
}

function renderRootConcurrent( root: FiberRoot, lanes: Lanes ) {
    const prevExecutionContext = getExecutionContext();
    activateRenderExecutionContext();
    const prevDispatcher = pushDispatcher( root.containerInfo );
    const prevCacheDispatcher = pushCacheDispatcher();

    // If the root or lanes have changed, throw out the existing stack
    // and prepare a fresh one. Otherwise we'll continue where we left off.
    if ( getWorkInProgressRoot() !== root || getWorkInProgressRootRenderLanes() !== lanes ) {
        if ( enableUpdaterTracking ) {
            if ( isDevToolsPresent ) {
                const memoizedUpdaters = root.memoizedUpdaters;

                if ( memoizedUpdaters.size > 0 ) {
                    restorePendingUpdaters( root, getWorkInProgressRootRenderLanes() );
                    memoizedUpdaters.clear();
                }

                // At this point, move Fibers that scheduled the upcoming work from the Map to the Set.
                // If we bailout on this work, we'll move them back (like above).
                // It's important to move them now in case the work spawns more work at the same priority with different updaters.
                // That way we can keep the current update and future updates separate.
                movePendingFibersToMemoized( root, lanes );
            }
        }

        setWorkInProgressTransitions( getTransitionsForLanes( root, lanes ) );
        resetWorkInProgressRootRenderTimer();
        prepareWorkInProgressFreshStack( root, lanes );
    }

    if ( __DEV__ ) {
        if ( enableDebugTracing ) {
            logRenderStarted( lanes );
        }
    }

    if ( enableSchedulingProfiler ) {
        markRenderStarted( lanes );
    }

    outer: do {
        try {
            if ( getWorkInProgressSuspendedReason() !== SuspendedReason.NotSuspended && getWorkInProgress() !== null ) {
                // The work loop is suspended. We need to either unwind the stack or
                // replay the suspended component.
                const unitOfWork = getWorkInProgressSafe();
                const thrownValue = getWorkInProgressThrownValue();

                resumeOrUnwind: switch ( getWorkInProgressSuspendedReason() ) {
                    case SuspendedReason.SuspendedOnError: {
                        // Unwind then continue with the normal work loop.
                        setWorkInProgressSuspendedReason( SuspendedReason.NotSuspended );
                        setWorkInProgressThrownValue( null );
                        throwAndUnwindWorkLoop( unitOfWork, thrownValue );
                        break;
                    }

                    case SuspendedReason.SuspendedOnData: {
                        const thenable: Thenable<unknown> = ( thrownValue as any );

                        if ( isThenableResolved( thenable ) ) {
                            // The data resolved. Try rendering the component again.
                            setWorkInProgressSuspendedReason( SuspendedReason.NotSuspended );
                            setWorkInProgressThrownValue( null );
                            replaySuspendedUnitOfWork( unitOfWork );
                            break;
                        }

                        // The work loop is suspended on data. We should wait for it to
                        // resolve before continuing to render.
                        // TODO: Handle the case where the promise resolves synchronously.
                        // Usually this is handled when we instrument the promise to add a
                        // `status` field, but if the promise already has a status, we won't
                        // have added a listener until right here.
                        const onResolution = () => {
                            // Check if the root is still suspended on this promise.
                            if ( getWorkInProgressSuspendedReason() === SuspendedReason.SuspendedOnData && getWorkInProgressRoot() === root ) {
                                // Mark the root as ready to continue rendering.
                                setWorkInProgressSuspendedReason( SuspendedReason.SuspendedAndReadyToContinue );
                            }

                            // Ensure the root is scheduled. We should do this even if we're
                            // currently working on a different root, so that we resume
                            // rendering later.
                            ReactFiberRootSchedulerShared.ensureRootScheduled( root );
                        };

                        thenable.then( onResolution, onResolution );
                        break outer;
                    }

                    case SuspendedReason.SuspendedOnImmediate: {
                        // If this fiber just suspended, it's possible the data is already
                        // cached. Yield to the main thread to give it a chance to ping. If
                        // it does, we can retry immediately without unwinding the stack.
                        setWorkInProgressSuspendedReason( SuspendedReason.SuspendedAndReadyToContinue );
                        break outer;
                    }

                    case SuspendedReason.SuspendedOnInstance: {
                        setWorkInProgressSuspendedReason( SuspendedReason.SuspendedOnInstanceAndReadyToContinue );
                        break outer;
                    }

                    case SuspendedReason.SuspendedAndReadyToContinue: {
                        const thenable: Thenable<unknown> = ( thrownValue as any );

                        if ( isThenableResolved( thenable ) ) {
                            // The data resolved. Try rendering the component again.
                            setWorkInProgressSuspendedReason( SuspendedReason.NotSuspended );
                            setWorkInProgressThrownValue( null );
                            replaySuspendedUnitOfWork( unitOfWork );
                        } else {
                            // Otherwise, unwind then continue with the normal work loop.
                            setWorkInProgressSuspendedReason( SuspendedReason.NotSuspended );
                            setWorkInProgressThrownValue( null );
                            throwAndUnwindWorkLoop( unitOfWork, thrownValue );
                        }

                        break;
                    }

                    case SuspendedReason.SuspendedOnInstanceAndReadyToContinue: {
                        switch ( getWorkInProgressSafe().tag ) {
                            case WorkTag.HostComponent:
                            case WorkTag.HostHoistable:
                            case WorkTag.HostSingleton: {
                                // Before unwinding the stack, check one more time if the
                                // instance is ready. It may have loaded when React yielded to
                                // the main thread.
                                // Assigning this to a constant so Flow knows the binding won't
                                // be mutated by `preloadInstance`.
                                const hostFiber = getWorkInProgressSafe();
                                const type = hostFiber.type;
                                const props = hostFiber.pendingProps;
                                const isReady = preloadInstance( type, props );

                                if ( isReady ) {
                                    // The data resolved. Resume the work loop as if nothing
                                    // suspended. Unlike when a user component suspends, we don't
                                    // have to replay anything because the host fiber
                                    // already completed.
                                    setWorkInProgressSuspendedReason( SuspendedReason.NotSuspended );
                                    setWorkInProgressThrownValue( null );
                                    const sibling = hostFiber.sibling;

                                    if ( sibling !== null ) {
                                        setWorkInProgress( sibling );
                                    } else {
                                        const returnFiber = hostFiber.return;

                                        if ( returnFiber !== null ) {
                                            setWorkInProgress( returnFiber );
                                            completeUnitOfWork( returnFiber );
                                        } else {
                                            setWorkInProgress( null );
                                        }
                                    }

                                    break resumeOrUnwind;
                                }

                                break;
                            }

                            default: {
                                // This will fail gracefully but it's not correct, so log a
                                // warning in dev.
                                if ( __DEV__ ) {
                                    console.error(
                                        "Unexpected type of fiber triggered a suspensey commit. " +
                                        "This is a bug in React."
                                    );
                                }

                                break;
                            }
                        }

                        // Otherwise, unwind then continue with the normal work loop.
                        setWorkInProgressSuspendedReason( SuspendedReason.NotSuspended );
                        setWorkInProgressThrownValue( null );
                        throwAndUnwindWorkLoop( unitOfWork, thrownValue );
                        break;
                    }

                    case SuspendedReason.SuspendedOnDeprecatedThrowPromise: {
                        // Suspended by an old implementation that uses the `throw promise`
                        // pattern. The newer replaying behavior can cause subtle issues
                        // like infinite ping loops. So we maintain the old behavior and
                        // always unwind.
                        setWorkInProgressSuspendedReason( SuspendedReason.NotSuspended );
                        setWorkInProgressThrownValue( null );
                        throwAndUnwindWorkLoop( unitOfWork, thrownValue );
                        break;
                    }

                    case SuspendedReason.SuspendedOnHydration: {
                        // Selective hydration. An update flowed into a dehydrated tree.
                        // Interrupt the current render so the work loop can switch to the
                        // hydration lane.
                        resetWorkInProgressStack();
                        setWorkInProgressRootExitStatus( RootExitStatus.RootDidNotComplete );
                        break outer;
                    }

                    default: {
                        throw new Error( "Unexpected SuspendedReason. This is a bug in React." );
                    }
                }
            }

            if ( __DEV__ && ReactCurrentActQueue.current !== null ) {
                // `act` special case: If we're inside an `act` scope, don't consult
                // `shouldYield`. Always keep working until the render is complete.
                // This is not just an optimization: in a unit test environment, we
                // can't trust the result of `shouldYield`, because the host I/O is
                // likely mocked.
                workLoopSync();
            } else {
                workLoopConcurrent();
            }

            break;
        } catch ( thrownValue ) {
            handleThrow( root, thrownValue );
        }
    } while ( true );

    resetContextDependencies();
    popDispatcher( prevDispatcher );
    popCacheDispatcher( prevCacheDispatcher );
    setExecutionContext( prevExecutionContext );

    if ( __DEV__ ) {
        if ( enableDebugTracing ) {
            logRenderStopped();
        }
    }

    // Check if the tree has completed.
    if ( getWorkInProgress() !== null ) {
        // Still work remaining.
        if ( enableSchedulingProfiler ) {
            markRenderYielded();
        }

        return RootExitStatus.RootInProgress;
    } else {
        // Completed the tree.
        if ( enableSchedulingProfiler ) {
            markRenderStopped();
        }

        // Set this to null to indicate there's no in-progress render.
        setWorkInProgressRoot( null );
        setWorkInProgressRootRenderLanes( NoLanes );
        // It's safe to process the queue now that the render phase is complete.
        finishQueueingConcurrentUpdates();
        // Return the final exit status.
        return getWorkInProgressRootExitStatus();
    }
}

function getContinuationForRoot( root: FiberRoot, originalCallbackNode: unknown ) {
    // This is called at the end of `performConcurrentWorkOnRoot` to determine
    // if we need to schedule a continuation task.
    //
    // Usually `scheduleTaskForRootDuringMicrotask` only runs inside a microtask;
    // however, since most of the logic for determining if we need a continuation
    // versus a new task is the same, we cheat a bit and call it here. This is
    // only safe to do because we know we're at the end of the browser task.
    // So although it's not an actual microtask, it might as well be.
    ReactFiberRootSchedulerShared.scheduleTaskForRootDuringMicrotask( root, now() );

    if ( root.callbackNode === originalCallbackNode ) {
        // The task node scheduled for this root is the same one that's
        // currently executed. Need to return a continuation.
        return performConcurrentWorkOnRoot.bind( null, root );
    }

    return null;
}
