"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.throwException = void 0;
var react_feature_flags_1 = require("@zenflux/react-shared/src/react-feature-flags");
var react_symbols_1 = require("@zenflux/react-shared/src/react-symbols");
var fiber_flags_1 = require("@zenflux/react-shared/src/react-internal-constants/fiber-flags");
var work_tags_1 = require("@zenflux/react-shared/src/react-internal-constants/work-tags");
var type_of_mode_1 = require("@zenflux/react-shared/src/react-internal-constants/type-of-mode");
var react_get_component_name_from_fiber_1 = require("@zenflux/react-reconciler/src/react-get-component-name-from-fiber");
var react_fiber_lane_1 = require("@zenflux/react-reconciler/src/react-fiber-lane");
var react_captured_value_1 = require("@zenflux/react-reconciler/src/react-captured-value");
var react_fiber_class_update_queue_1 = require("@zenflux/react-reconciler/src/react-fiber-class-update-queue");
var react_fiber_suspense_context_1 = require("@zenflux/react-reconciler/src/react-fiber-suspense-context");
var react_fiber_new_context_1 = require("@zenflux/react-reconciler/src/react-fiber-new-context");
var react_debug_tracing_1 = require("@zenflux/react-reconciler/src/react-debug-tracing");
var react_fiber_dev_tools_hook_1 = require("@zenflux/react-reconciler/src/react-fiber-dev-tools-hook");
var react_fiber_work_legacy_error_boundary_1 = require("@zenflux/react-reconciler/src/react-fiber-work-legacy-error-boundary");
var react_fiber_commit_work_1 = require("@zenflux/react-reconciler/src/react-fiber-commit-work");
var react_fiber_work_in_progress_render_did_1 = require("@zenflux/react-reconciler/src/react-fiber-work-in-progress-render-did");
var react_fiber_hydration_error_1 = require("@zenflux/react-reconciler/src/react-fiber-hydration-error");
var react_fiber_hydration_did_suspend_on_error_1 = require("@zenflux/react-reconciler/src/react-fiber-hydration-did-suspend-on-error");
var react_fiber_hydration_is_hydrating_1 = require("@zenflux/react-reconciler/src/react-fiber-hydration-is-hydrating");
var react_fiber_throw_suspense_component_1 = require("@zenflux/react-reconciler/src/react-fiber-throw-suspense-component");
var react_fiber_throw_suspense_boundary_1 = require("@zenflux/react-reconciler/src/react-fiber-throw-suspense-boundary");
var react_fiber_throw_offscreen_component_1 = require("@zenflux/react-reconciler/src/react-fiber-throw-offscreen-component");
var react_fiber_throw_suspense_no_boundary_1 = require("@zenflux/react-reconciler/src/react-fiber-throw-suspense-no-boundary");
var react_fiber_throw_error_update_1 = require("@zenflux/react-reconciler/src/react-fiber-throw-error-update");
function resetSuspendedComponent(sourceFiber, rootRenderLanes) {
    if (react_feature_flags_1.enableLazyContextPropagation) {
        var currentSourceFiber = sourceFiber.alternate;
        if (currentSourceFiber !== null) {
            // Since we never visited the children of the suspended component, we
            // need to propagate the context change now, to ensure that we visit
            // them during the retry.
            //
            // We don't have to do this for errors because we retry errors without
            // committing in between. So this is specific to Suspense.
            (0, react_fiber_new_context_1.propagateParentContextChangesToDeferredTree)(currentSourceFiber, sourceFiber, rootRenderLanes);
        }
    }
    // Reset the memoizedState to what it was before we attempted to render it.
    // A legacy mode Suspense quirk, only relevant to hook components.
    var tag = sourceFiber.tag;
    if ((sourceFiber.mode & type_of_mode_1.TypeOfMode.ConcurrentMode) === type_of_mode_1.TypeOfMode.NoMode && (tag === work_tags_1.WorkTag.FunctionComponent || tag === work_tags_1.WorkTag.ForwardRef || tag === work_tags_1.WorkTag.SimpleMemoComponent)) {
        var currentSource = sourceFiber.alternate;
        if (currentSource) {
            sourceFiber.updateQueue = currentSource.updateQueue;
            sourceFiber.memoizedState = currentSource.memoizedState;
            sourceFiber.lanes = currentSource.lanes;
        }
        else {
            sourceFiber.updateQueue = null;
            sourceFiber.memoizedState = null;
        }
    }
}
function throwException(root, returnFiber, sourceFiber, value, rootRenderLanes) {
    // The source fiber did not complete.
    sourceFiber.flags |= fiber_flags_1.FiberFlags.Incomplete;
    if (react_feature_flags_1.enableUpdaterTracking) {
        if (react_fiber_dev_tools_hook_1.isDevToolsPresent) {
            // If we have pending work still, restore the original updaters
            (0, react_fiber_commit_work_1.restorePendingUpdaters)(root, rootRenderLanes);
        }
    }
    if (value !== null && typeof value === "object") {
        if (react_feature_flags_1.enablePostpone && value.$$typeof === react_symbols_1.REACT_POSTPONE_TYPE) {
            // Act as if this is an infinitely suspending promise.
            value = {
                then: function () {
                }
            };
        }
        if (typeof value.then === "function") {
            // This is a wakeable. The component suspended.
            var wakeable = value;
            resetSuspendedComponent(sourceFiber, rootRenderLanes);
            if (__DEV__) {
                if ((0, react_fiber_hydration_is_hydrating_1.isHydrating)() && sourceFiber.mode & type_of_mode_1.TypeOfMode.ConcurrentMode) {
                    (0, react_fiber_hydration_did_suspend_on_error_1.markDidThrowWhileHydratingDEV)();
                }
            }
            if (__DEV__) {
                if (react_feature_flags_1.enableDebugTracing) {
                    if (sourceFiber.mode & type_of_mode_1.TypeOfMode.DebugTracingMode) {
                        var name_1 = (0, react_get_component_name_from_fiber_1.default)(sourceFiber) || "Unknown";
                        (0, react_debug_tracing_1.logComponentSuspended)(name_1, wakeable);
                    }
                }
            }
            // Mark the nearest Suspense boundary to switch to rendering a fallback.
            var suspenseBoundary = (0, react_fiber_suspense_context_1.getSuspenseHandler)();
            if (suspenseBoundary !== null) {
                switch (suspenseBoundary.tag) {
                    case work_tags_1.WorkTag.SuspenseComponent: {
                        (0, react_fiber_throw_suspense_component_1.handleSuspenseComponent)(sourceFiber, returnFiber, suspenseBoundary, root, rootRenderLanes, wakeable);
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
                    case work_tags_1.WorkTag.OffscreenComponent: {
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
                        if ((0, react_fiber_throw_offscreen_component_1.handleOffscreenComponent)(sourceFiber, returnFiber, suspenseBoundary, root, rootRenderLanes, wakeable)) {
                            return;
                        }
                    }
                }
                throw new Error("Unexpected Suspense handler tag (".concat(suspenseBoundary.tag, "). This ") + "is a bug in React.");
            }
            else {
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
                var result = (0, react_fiber_throw_suspense_no_boundary_1.handleSuspenseNoBoundary)(root, wakeable, rootRenderLanes);
                if (result) {
                    value = result;
                }
                else {
                    return;
                }
            }
        }
    }
    // This is a regular error, not a Suspense wakeable.
    if ((0, react_fiber_hydration_is_hydrating_1.isHydrating)() && sourceFiber.mode & type_of_mode_1.TypeOfMode.ConcurrentMode) {
        (0, react_fiber_hydration_did_suspend_on_error_1.markDidThrowWhileHydratingDEV)();
        var suspenseBoundary = (0, react_fiber_suspense_context_1.getSuspenseHandler)();
        // If the error was thrown during hydration, we may be able to recover by
        // discarding the dehydrated content and switching to a client render.
        // Instead of surfacing the error, find the nearest Suspense boundary
        // and render it again without hydration.
        if (suspenseBoundary !== null) {
            if ((suspenseBoundary.flags & fiber_flags_1.FiberFlags.ShouldCapture) === fiber_flags_1.FiberFlags.NoFlags) {
                // Set a flag to indicate that we should try rendering the normal
                // children again, not the fallback.
                suspenseBoundary.flags |= fiber_flags_1.FiberFlags.ForceClientRender;
            }
            (0, react_fiber_throw_suspense_boundary_1.markSuspenseBoundaryShouldCapture)(suspenseBoundary, returnFiber, sourceFiber, root, rootRenderLanes);
            // Even though the user may not be affected by this error, we should
            // still log it, so it can be fixed.
            (0, react_fiber_hydration_error_1.queueHydrationError)((0, react_captured_value_1.createCapturedValueAtFiber)(value, sourceFiber));
            return;
        }
    }
    else { // Otherwise, fall through to the error path.
    }
    value = (0, react_captured_value_1.createCapturedValueAtFiber)(value, sourceFiber);
    (0, react_fiber_work_in_progress_render_did_1.renderDidError)(value);
    // We didn't find a boundary that could handle this type of exception. Start
    // over and traverse parent path again, this time treating the exception
    // as an error.
    var workInProgress = returnFiber;
    do {
        switch (workInProgress.tag) {
            case work_tags_1.WorkTag.HostRoot: {
                var errorInfo_1 = value;
                workInProgress.flags |= fiber_flags_1.FiberFlags.ShouldCapture;
                var lane = (0, react_fiber_lane_1.pickArbitraryLane)(rootRenderLanes);
                workInProgress.lanes = (0, react_fiber_lane_1.mergeLanes)(workInProgress.lanes, lane);
                var update = (0, react_fiber_throw_error_update_1.createRootErrorUpdate)(workInProgress, errorInfo_1, lane);
                (0, react_fiber_class_update_queue_1.enqueueCapturedUpdate)(workInProgress, update);
                return;
            }
            case work_tags_1.WorkTag.ClassComponent:
                // Capture and retry
                var errorInfo = value;
                var ctor = workInProgress.type;
                var instance = workInProgress.stateNode;
                if ((workInProgress.flags & fiber_flags_1.FiberFlags.DidCapture) === fiber_flags_1.FiberFlags.NoFlags &&
                    (typeof ctor.getDerivedStateFromError === "function" || instance !== null &&
                        typeof instance.componentDidCatch === "function" &&
                        !(0, react_fiber_work_legacy_error_boundary_1.isAlreadyFailedLegacyErrorBoundary)(instance))) {
                    workInProgress.flags |= fiber_flags_1.FiberFlags.ShouldCapture;
                    var lane = (0, react_fiber_lane_1.pickArbitraryLane)(rootRenderLanes);
                    workInProgress.lanes = (0, react_fiber_lane_1.mergeLanes)(workInProgress.lanes, lane);
                    // Schedule the error boundary to re-render using updated state
                    var update = (0, react_fiber_throw_error_update_1.createClassErrorUpdate)(workInProgress, errorInfo, lane);
                    (0, react_fiber_class_update_queue_1.enqueueCapturedUpdate)(workInProgress, update);
                    return;
                }
                break;
            default:
                break;
        }
        // $FlowFixMe[incompatible-type] we bail out when we get a null
        workInProgress = workInProgress.return;
    } while (workInProgress !== null);
}
exports.throwException = throwException;
