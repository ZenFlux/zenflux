import {
    enableDebugTracing,
    enableLazyContextPropagation,
    enablePostpone,
    enableUpdaterTracking
} from "@zenflux/react-shared/src/react-feature-flags";

import { REACT_POSTPONE_TYPE } from "@zenflux/react-shared/src/react-symbols";

import { FiberFlags } from "@zenflux/react-shared/src/react-internal-constants/fiber-flags";

import { WorkTag } from "@zenflux/react-shared/src/react-internal-constants/work-tags";

import { TypeOfMode } from "@zenflux/react-shared/src/react-internal-constants/type-of-mode";

import reactGetComponentNameFromFiber from "@zenflux/react-reconciler/src/react-get-component-name-from-fiber";

import { mergeLanes, pickArbitraryLane } from "@zenflux/react-reconciler/src/react-fiber-lane";

import { createCapturedValueAtFiber } from "@zenflux/react-reconciler/src/react-captured-value";

import { enqueueCapturedUpdate, } from "@zenflux/react-reconciler/src/react-fiber-class-update-queue";
import { getSuspenseHandler } from "@zenflux/react-reconciler/src/react-fiber-suspense-context";

import { propagateParentContextChangesToDeferredTree } from "@zenflux/react-reconciler/src/react-fiber-new-context";
import { logComponentSuspended } from "@zenflux/react-reconciler/src/react-debug-tracing";
import { isDevToolsPresent } from "@zenflux/react-reconciler/src/react-fiber-dev-tools-hook";

import { isAlreadyFailedLegacyErrorBoundary, } from "@zenflux/react-reconciler/src/react-fiber-work-legacy-error-boundary";
import { restorePendingUpdaters } from "@zenflux/react-reconciler/src/react-fiber-commit-work";
import { renderDidError, } from "@zenflux/react-reconciler/src/react-fiber-work-in-progress-render-did";
import { queueHydrationError } from "@zenflux/react-reconciler/src/react-fiber-hydration-error";
import { markDidThrowWhileHydratingDEV } from "@zenflux/react-reconciler/src/react-fiber-hydration-did-suspend-on-error";
import { isHydrating } from "@zenflux/react-reconciler/src/react-fiber-hydration-is-hydrating";
import { handleSuspenseComponent } from "@zenflux/react-reconciler/src/react-fiber-throw-suspense-component";
import { markSuspenseBoundaryShouldCapture } from "@zenflux/react-reconciler/src/react-fiber-throw-suspense-boundary";
import { handleOffscreenComponent } from "@zenflux/react-reconciler/src/react-fiber-throw-offscreen-component";
import { handleSuspenseNoBoundary } from "@zenflux/react-reconciler/src/react-fiber-throw-suspense-no-boundary";
import {
    createClassErrorUpdate,
    createRootErrorUpdate
} from "@zenflux/react-reconciler/src/react-fiber-throw-error-update";

import type { Fiber, FiberRoot, Lanes } from "@zenflux/react-shared/src/react-internal-types";
import type { Wakeable } from "@zenflux/react-shared/src/react-types";

function resetSuspendedComponent( sourceFiber: Fiber, rootRenderLanes: Lanes ) {
    if ( enableLazyContextPropagation ) {
        const currentSourceFiber = sourceFiber.alternate;

        if ( currentSourceFiber !== null ) {
            // Since we never visited the children of the suspended component, we
            // need to propagate the context change now, to ensure that we visit
            // them during the retry.
            //
            // We don't have to do this for errors because we retry errors without
            // committing in between. So this is specific to Suspense.
            propagateParentContextChangesToDeferredTree( currentSourceFiber, sourceFiber, rootRenderLanes );
        }
    }

    // Reset the memoizedState to what it was before we attempted to render it.
    // A legacy mode Suspense quirk, only relevant to hook components.
    const tag = sourceFiber.tag;

    if ( ( sourceFiber.mode & TypeOfMode.ConcurrentMode ) === TypeOfMode.NoMode && ( tag === WorkTag.FunctionComponent || tag === WorkTag.ForwardRef || tag === WorkTag.SimpleMemoComponent ) ) {
        const currentSource = sourceFiber.alternate;

        if ( currentSource ) {
            sourceFiber.updateQueue = currentSource.updateQueue;
            sourceFiber.memoizedState = currentSource.memoizedState;
            sourceFiber.lanes = currentSource.lanes;
        } else {
            sourceFiber.updateQueue = null;
            sourceFiber.memoizedState = null;
        }
    }
}

export function throwException( root: FiberRoot, returnFiber: Fiber, sourceFiber: Fiber, value: any, rootRenderLanes: Lanes ): void {
    // The source fiber did not complete.
    sourceFiber.flags |= FiberFlags.Incomplete;

    if ( enableUpdaterTracking ) {
        if ( isDevToolsPresent ) {
            // If we have pending work still, restore the original updaters
            restorePendingUpdaters( root, rootRenderLanes );
        }
    }

    if ( value !== null && typeof value === "object" ) {
        if ( enablePostpone && value.$$typeof === REACT_POSTPONE_TYPE ) {
            // Act as if this is an infinitely suspending promise.
            value = {
                then: function () {
                }
            };
        }

        if ( typeof value.then === "function" ) {
            // This is a wakeable. The component suspended.
            const wakeable: Wakeable = ( value as any );
            resetSuspendedComponent( sourceFiber, rootRenderLanes );

            if ( __DEV__ ) {
                if ( isHydrating() && sourceFiber.mode & TypeOfMode.ConcurrentMode ) {
                    markDidThrowWhileHydratingDEV();
                }
            }

            if ( __DEV__ ) {
                if ( enableDebugTracing ) {
                    if ( sourceFiber.mode & TypeOfMode.DebugTracingMode ) {
                        const name = reactGetComponentNameFromFiber( sourceFiber ) || "Unknown";
                        logComponentSuspended( name, wakeable );
                    }
                }
            }

            // Mark the nearest Suspense boundary to switch to rendering a fallback.
            const suspenseBoundary = getSuspenseHandler();

            if ( suspenseBoundary !== null ) {
                switch ( suspenseBoundary.tag ) {
                    case WorkTag.SuspenseComponent: {
                        handleSuspenseComponent(
                            sourceFiber,
                            returnFiber,
                            suspenseBoundary,
                            root,
                            rootRenderLanes,
                            wakeable
                        );
                        return;

                        // // If this suspense boundary is not already showing a fallback, mark
                        // // the in-progress render as suspended. We try to perform this logic
                        // // as soon as soon as possible during the render phase, so the work
                        // // loop can know things like whether it's OK to switch to other tasks,
                        // // or whether it can wait for data to resolve before continuing.
                        // // TODO: Most of these checks are already performed when entering a
                        // // Suspense boundary. We should track the information on the stack so
                        // // we don't have to recompute it on demand. This would also allow us
                        // // to unify with `use` which needs to perform this logic even sooner,
                        // // before `throwException` is called.
                        // if ( sourceFiber.mode & ConcurrentMode ) {
                        //     if ( getShellBoundary() === null ) {
                        //         // Suspended in the "shell" of the app. This is an undesirable
                        //         // loading state. We should avoid committing this tree.
                        //         renderDidSuspendDelayIfPossible();
                        //     } else {
                        //         // If we suspended deeper than the shell, we don't need to delay
                        //         // the commmit. However, we still call renderDidSuspend if this is
                        //         // a new boundary, to tell the work loop that a new fallback has
                        //         // appeared during this render.
                        //         // TODO: Theoretically we should be able to delete this branch.
                        //         // It's currently used for two things: 1) to throttle the
                        //         // appearance of successive loading states, and 2) in
                        //         // SuspenseList, to determine whether the children include any
                        //         // pending fallbacks. For 1, we should apply throttling to all
                        //         // retries, not just ones that render an additional fallback. For
                        //         // 2, we should check subtreeFlags instead. Then we can delete
                        //         // this branch.
                        //         const current = suspenseBoundary.alternate;
                        //
                        //         if ( current === null ) {
                        //             renderDidSuspend();
                        //         }
                        //     }
                        // }
                        //
                        // suspenseBoundary.flags &= ~FiberFlags.ForceClientRender;
                        // markSuspenseBoundaryShouldCapture( suspenseBoundary, returnFiber, sourceFiber, root, rootRenderLanes );
                        // // Retry listener
                        // //
                        // // If the fallback does commit, we need to attach a different type of
                        // // listener. This one schedules an update on the Suspense boundary to
                        // // turn the fallback state off.
                        // //
                        // // Stash the wakeable on the boundary fiber so we can access it in the
                        // // commit phase.
                        // //
                        // // When the wakeable resolves, we'll attempt to render the boundary
                        // // again ("retry").
                        // // Check if this is a Suspensey resource. We do not attach retry
                        // // listeners to these, because we don't actually need them for
                        // // rendering. Only for committing. Instead, if a fallback commits
                        // // and the only thing that suspended was a Suspensey resource, we
                        // // retry immediately.
                        // // TODO: Refactor throwException so that we don't have to do this type
                        // // check. The caller already knows what the cause was.
                        // const isSuspenseyResource = wakeable === noopSuspenseyCommitThenable;
                        //
                        // if ( isSuspenseyResource ) {
                        //     suspenseBoundary.flags |= ScheduleRetry;
                        // } else {
                        //     const retryQueue: RetryQueue | null = ( suspenseBoundary.updateQueue as any );
                        //
                        //     if ( retryQueue === null ) {
                        //         suspenseBoundary.updateQueue = new Set( [ wakeable ] );
                        //     } else {
                        //         retryQueue.add( wakeable );
                        //     }
                        //
                        //     // We only attach ping listeners in concurrent mode. Legacy
                        //     // Suspense always commits fallbacks synchronously, so there are
                        //     // no pings.
                        //     if ( suspenseBoundary.mode & TypeOfMode.ConcurrentMode ) {
                        //         attachPingListener( root, wakeable, rootRenderLanes );
                        //     }
                        // }
                        //
                        // return;
                    }

                    case WorkTag.OffscreenComponent: {
                        // if ( suspenseBoundary.mode & TypeOfMode.ConcurrentMode ) {
                        //     suspenseBoundary.flags |= FiberFlags.ShouldCapture;
                        //     const isSuspenseyResource = wakeable === noopSuspenseyCommitThenable;
                        //
                        //     if ( isSuspenseyResource ) {
                        //         suspenseBoundary.flags |= ScheduleRetry;
                        //     } else {
                        //         const offscreenQueue: OffscreenQueue | null = ( suspenseBoundary.updateQueue as any );
                        //
                        //         if ( offscreenQueue === null ) {
                        //             suspenseBoundary.updateQueue = {
                        //                 transitions: null,
                        //                 markerInstances: null,
                        //                 retryQueue: new Set( [ wakeable ] )
                        //             };
                        //         } else {
                        //             const retryQueue = offscreenQueue.retryQueue;
                        //
                        //             if ( retryQueue === null ) {
                        //                 offscreenQueue.retryQueue = new Set( [ wakeable ] );
                        //             } else {
                        //                 retryQueue.add( wakeable );
                        //             }
                        //         }
                        //
                        //         attachPingListener( root, wakeable, rootRenderLanes );
                        //     }
                        //
                        //     return;
                        // }

                        if ( handleOffscreenComponent( sourceFiber, returnFiber, suspenseBoundary, root, rootRenderLanes, wakeable ) ) {
                            return;
                        }
                    }
                }

                throw new Error( `Unexpected Suspense handler tag (${ suspenseBoundary.tag }). This ` + "is a bug in React." );
            } else {
                // // No boundary was found. Unless this is a sync update, this is OK.
                // // We can suspend and wait for more data to arrive.
                // if ( root.tag === ConcurrentRoot ) {
                //     // In a concurrent root, suspending without a Suspense boundary is
                //     // allowed. It will suspend indefinitely without committing.
                //     //
                //     // TODO: Should we have different behavior for discrete updates? What
                //     // about flushSync? Maybe it should put the tree into an inert state,
                //     // and potentially log a warning. Revisit this for a future release.
                //     attachPingListener( root, wakeable, rootRenderLanes );
                //     renderDidSuspendDelayIfPossible();
                //     return;
                // } else {
                //     // In a legacy root, suspending without a boundary is always an error.
                //     const uncaughtSuspenseError = new Error( "A component suspended while responding to synchronous input. This " + "will cause the UI to be replaced with a loading indicator. To " + "fix, updates that suspend should be wrapped " + "with startTransition." );
                //     value = uncaughtSuspenseError;
                // }
                const result = handleSuspenseNoBoundary( root, wakeable, rootRenderLanes );

                if ( result ) {
                    value = result;
                } else {
                    return;
                }
            }
        }
    }

    // This is a regular error, not a Suspense wakeable.
    if ( isHydrating() && sourceFiber.mode & TypeOfMode.ConcurrentMode ) {
        markDidThrowWhileHydratingDEV();
        const suspenseBoundary = getSuspenseHandler();

        // If the error was thrown during hydration, we may be able to recover by
        // discarding the dehydrated content and switching to a client render.
        // Instead of surfacing the error, find the nearest Suspense boundary
        // and render it again without hydration.
        if ( suspenseBoundary !== null ) {
            if ( ( suspenseBoundary.flags & FiberFlags.ShouldCapture ) === FiberFlags.NoFlags ) {
                // Set a flag to indicate that we should try rendering the normal
                // children again, not the fallback.
                suspenseBoundary.flags |= FiberFlags.ForceClientRender;
            }

            markSuspenseBoundaryShouldCapture( suspenseBoundary, returnFiber, sourceFiber, root, rootRenderLanes );
            // Even though the user may not be affected by this error, we should
            // still log it, so it can be fixed.
            queueHydrationError( createCapturedValueAtFiber( value, sourceFiber ) );
            return;
        }
    } else {// Otherwise, fall through to the error path.
    }

    value = createCapturedValueAtFiber( value, sourceFiber );

    renderDidError( value );

    // We didn't find a boundary that could handle this type of exception. Start
    // over and traverse parent path again, this time treating the exception
    // as an error.
    let workInProgress: Fiber | null = returnFiber;

    do {
        switch ( workInProgress.tag ) {
            case WorkTag.HostRoot: {
                const errorInfo = value;
                workInProgress.flags |= FiberFlags.ShouldCapture;
                const lane = pickArbitraryLane( rootRenderLanes );
                workInProgress.lanes = mergeLanes( workInProgress.lanes, lane );
                const update = createRootErrorUpdate( workInProgress, errorInfo, lane );
                enqueueCapturedUpdate( workInProgress, update );
                return;
            }

            case WorkTag.ClassComponent:
                // Capture and retry
                const errorInfo = value;
                const ctor = workInProgress.type;
                const instance = workInProgress.stateNode;

                if (
                    ( workInProgress.flags & FiberFlags.DidCapture ) === FiberFlags.NoFlags &&
                    (
                        typeof ctor.getDerivedStateFromError === "function" || instance !== null &&
                        typeof instance.componentDidCatch === "function" &&
                        ! isAlreadyFailedLegacyErrorBoundary( instance )
                    )
                ) {
                    workInProgress.flags |= FiberFlags.ShouldCapture;
                    const lane = pickArbitraryLane( rootRenderLanes );
                    workInProgress.lanes = mergeLanes( workInProgress.lanes, lane );
                    // Schedule the error boundary to re-render using updated state
                    const update = createClassErrorUpdate( workInProgress, errorInfo, lane );
                    enqueueCapturedUpdate( workInProgress, update );
                    return;
                }

                break;

            default:
                break;
        }

        // $FlowFixMe[incompatible-type] we bail out when we get a null
        workInProgress = workInProgress.return;
    } while ( workInProgress !== null );
}

