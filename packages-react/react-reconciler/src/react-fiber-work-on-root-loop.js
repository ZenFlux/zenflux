"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.replaySuspendedUnitOfWork = exports.performUnitOfWork = exports.completeUnitOfWork = exports.throwAndUnwindWorkLoop = exports.workLoopSync = void 0;
var react_feature_flags_1 = require("@zenflux/react-shared/src/react-feature-flags");
var react_error_utils_1 = require("@zenflux/react-shared/src/react-error-utils");
var react_shared_internals_1 = require("@zenflux/react-shared/src/react-shared-internals");
var work_tags_1 = require("@zenflux/react-shared/src/react-internal-constants/work-tags");
var type_of_mode_1 = require("@zenflux/react-shared/src/react-internal-constants/type-of-mode");
var fiber_flags_1 = require("@zenflux/react-shared/src/react-internal-constants/fiber-flags");
var react_entangled_lane_1 = require("@zenflux/react-reconciler/src/react-entangled-lane");
var react_fiber_work_in_progress_1 = require("@zenflux/react-reconciler/src/react-fiber-work-in-progress");
var react_fiber_work_unwind_1 = require("@zenflux/react-reconciler/src/react-fiber-work-unwind");
var root_exit_status_1 = require("@zenflux/react-reconciler/src/root-exit-status");
var react_fiber_throw_1 = require("@zenflux/react-reconciler/src/react-fiber-throw");
var react_current_fiber_1 = require("@zenflux/react-reconciler/src/react-current-fiber");
var react_fiber_complete_work_1 = require("@zenflux/react-reconciler/src/react-fiber-complete-work");
var react_profile_timer_1 = require("@zenflux/react-reconciler/src/react-profile-timer");
var react_fiber_unwind_work_1 = require("@zenflux/react-reconciler/src/react-fiber-unwind-work");
var react_fiber_lazy_component_1 = require("@zenflux/react-reconciler/src/react-fiber-lazy-component");
var react_fiber_context_1 = require("@zenflux/react-reconciler/src/react-fiber-context");
var react_fiber_work_begin_1 = require("@zenflux/react-reconciler/src/react-fiber-work-begin");
var react_fiber_hooks_unwind_1 = require("@zenflux/react-reconciler/src/react-fiber-hooks-unwind");
var react_fiber_1 = require("@zenflux/react-reconciler/src/react-fiber");
var react_fiber_hydration_did_suspend_on_error_1 = require("@zenflux/react-reconciler/src/react-fiber-hydration-did-suspend-on-error");
var react_fiber_thenable_1 = require("@zenflux/react-reconciler/src/react-fiber-thenable");
var react_fiber_work_selective_hydration_exception_1 = require("@zenflux/react-reconciler/src/react-fiber-work-selective-hydration-exception");
var ReactCurrentOwner = react_shared_internals_1.default.ReactCurrentOwner;
var beginWork;
if (__DEV__ && react_feature_flags_1.replayFailedUnitOfWorkWithInvokeGuardedCallback) {
    var dummyFiber_1 = null;
    beginWork = function (current, unitOfWork, lanes) {
        // If a component throws an error, we replay it again in a synchronously
        // dispatched event, so that the debugger will treat it as an uncaught
        // error See ReactErrorUtils for more information.
        // Before entering the begin phase, copy the work-in-progress onto a dummy
        // fiber. If beginWork throws, we'll use this to reset the state.
        var originalWorkInProgressCopy = (0, react_fiber_1.assignFiberPropertiesInDEV)(dummyFiber_1, unitOfWork);
        try {
            return (0, react_fiber_work_begin_1.beginWork)(current, unitOfWork, lanes);
        }
        catch (originalError) {
            if ((0, react_fiber_hydration_did_suspend_on_error_1.didSuspendOrErrorWhileHydratingDEV)() ||
                originalError === react_fiber_thenable_1.SuspenseException ||
                originalError === react_fiber_work_selective_hydration_exception_1.SelectiveHydrationException ||
                (originalError !== null &&
                    typeof originalError === "object" &&
                    typeof originalError.then === "function")) { // Don't replay promises.
                // Don't replay errors if we are hydrating and have already suspended or handled an error
                throw originalError;
            }
            // Don't reset current debug fiber, since we're about to work on the
            // same fiber again.
            // Unwind the failed stack frame
            (0, react_fiber_work_unwind_1.resetSuspendedWorkLoopOnUnwind)(unitOfWork);
            (0, react_fiber_unwind_work_1.unwindInterruptedWork)(current, unitOfWork, (0, react_fiber_work_in_progress_1.getWorkInProgressRootRenderLanes)());
            // Restore the original properties of the fiber.
            (0, react_fiber_1.assignFiberPropertiesInDEV)(unitOfWork, originalWorkInProgressCopy);
            if (react_feature_flags_1.enableProfilerTimer && unitOfWork.mode & type_of_mode_1.TypeOfMode.ProfileMode) {
                // Reset the profiler timer.
                (0, react_profile_timer_1.startProfilerTimer)(unitOfWork);
            }
            // Run beginWork again.
            (0, react_error_utils_1.invokeGuardedCallback)(null, react_fiber_work_begin_1.beginWork, null, current, unitOfWork, lanes);
            if ((0, react_error_utils_1.hasCaughtError)()) {
                var replayError = (0, react_error_utils_1.clearCaughtError)();
                if (typeof replayError === "object" && replayError !== null && replayError._suppressLogging && typeof originalError === "object" && originalError !== null && !originalError._suppressLogging) {
                    // If suppressed, let the flag carry over to the original error which is the one we'll rethrow.
                    originalError._suppressLogging = true;
                }
            }
            // We always throw the original error in case the second render pass is not idempotent.
            // This can happen if a memoized function or CommonJS module doesn't throw after first invocation.
            throw originalError;
        }
    };
}
else {
    beginWork = react_fiber_work_begin_1.beginWork;
}
// The work loop is an extremely hot path. Tell Closure not to inline it.
/** @noinline */
function workLoopSync() {
    // Perform work without checking if we need to yield between fiber.
    while ((0, react_fiber_work_in_progress_1.getWorkInProgress)() !== null) {
        performUnitOfWork((0, react_fiber_work_in_progress_1.getWorkInProgressSafe)());
    }
}
exports.workLoopSync = workLoopSync;
function throwAndUnwindWorkLoop(unitOfWork, thrownValue) {
    // This is a fork of performUnitOfWork specifcally for unwinding a fiber
    // that threw an exception.
    //
    // Return to the normal work loop. This will unwind the stack, and potentially
    // result in showing a fallback.
    (0, react_fiber_work_unwind_1.resetSuspendedWorkLoopOnUnwind)(unitOfWork);
    var returnFiber = unitOfWork.return;
    if (returnFiber === null || (0, react_fiber_work_in_progress_1.getWorkInProgressRoot)() === null) {
        // Expected to be working on a non-root fiber. This is a fatal error
        // because there's no ancestor that can handle it; the root is
        // supposed to capture all errors that weren't caught by an error
        // boundary.
        (0, react_fiber_work_in_progress_1.setWorkInProgressRootExitStatus)(root_exit_status_1.RootExitStatus.RootFatalErrored);
        (0, react_fiber_work_in_progress_1.setWorkInProgressRootFatalError)(thrownValue);
        // Set `WorkInProgress` to null. This represents advancing to the next
        // sibling, or the parent if there are no siblings. But since the root
        // has no siblings nor a parent, we set it to null. Usually this is
        // handled by `completeUnitOfWork` or `unwindWork`, but since we're
        // intentionally not calling those, we need set it here.
        // TODO: Consider calling `unwindWork` to pop the contexts.
        (0, react_fiber_work_in_progress_1.setWorkInProgress)(null);
        return;
    }
    try {
        // Find and mark the nearest Suspense or error boundary that can handle
        // this "exception".
        (0, react_fiber_throw_1.throwException)((0, react_fiber_work_in_progress_1.getWorkInProgressRoot)(), returnFiber, unitOfWork, thrownValue, (0, react_fiber_work_in_progress_1.getWorkInProgressRootRenderLanes)());
    }
    catch (error) {
        // We had trouble processing the error. An example of this happening is
        // when accessing the `componentDidCatch` property of an error boundary
        // throws an error. A weird edge case. There's a regression test for this.
        // To prevent an infinite loop, bubble the error up to the next parent.
        (0, react_fiber_work_in_progress_1.setWorkInProgress)(returnFiber);
        throw error;
    }
    if (unitOfWork.flags & fiber_flags_1.FiberFlags.Incomplete) {
        // Unwind the stack until we reach the nearest boundary.
        unwindUnitOfWork(unitOfWork);
    }
    else {
        // Although the fiber suspended, we're intentionally going to commit it in
        // an inconsistent state. We can do this safely in cases where we know the
        // inconsistent tree will be hidden.
        //
        // This currently only applies to Legacy Suspense implementation, but we may
        // port a version of this to concurrent roots, too, when performing a
        // synchronous render. Because that will allow us to mutate the tree as we
        // go instead of buffering mutations until the end. Though it's unclear if
        // this particular path is how that would be implemented.
        completeUnitOfWork(unitOfWork);
    }
}
exports.throwAndUnwindWorkLoop = throwAndUnwindWorkLoop;
function completeUnitOfWork(unitOfWork) {
    // Attempt to complete the current unit of work, then move to the next
    // sibling. If there are no more siblings, return to the parent fiber.
    var completedWork = unitOfWork;
    do {
        if (__DEV__) {
            if ((completedWork.flags & fiber_flags_1.FiberFlags.Incomplete) !== fiber_flags_1.FiberFlags.NoFlags) {
                // NOTE: If we re-enable sibling prerendering in some cases, this branch
                // is where we would switch to the unwinding path.
                console.error("Internal React error: Expected this fiber to be complete, but " + "it isn't. It should have been unwound. This is a bug in React.");
            }
        }
        // The current, flushed, state of this fiber is the alternate. Ideally
        // nothing should rely on this, but relying on it here means that we don't
        // need an additional field on the work in progress.
        var current = completedWork.alternate;
        var returnFiber = completedWork.return;
        (0, react_current_fiber_1.setCurrentFiber)(completedWork);
        var next = void 0;
        if (!react_feature_flags_1.enableProfilerTimer || (completedWork.mode & type_of_mode_1.TypeOfMode.ProfileMode) === type_of_mode_1.TypeOfMode.NoMode) {
            next = (0, react_fiber_complete_work_1.completeWork)(current, completedWork, (0, react_entangled_lane_1.getEntangledRenderLanes)());
        }
        else {
            (0, react_profile_timer_1.startProfilerTimer)(completedWork);
            next = (0, react_fiber_complete_work_1.completeWork)(current, completedWork, (0, react_entangled_lane_1.getEntangledRenderLanes)());
            // Update render duration assuming we didn't error.
            (0, react_profile_timer_1.stopProfilerTimerIfRunningAndRecordDelta)(completedWork, false);
        }
        (0, react_current_fiber_1.resetCurrentFiber)();
        if (next !== null) {
            // Completing this fiber spawned new work. Work on that next.
            (0, react_fiber_work_in_progress_1.setWorkInProgress)(next);
            return;
        }
        var siblingFiber = completedWork.sibling;
        if (siblingFiber !== null) {
            // If there is more work to do in this returnFiber, do that next.
            (0, react_fiber_work_in_progress_1.setWorkInProgress)(siblingFiber);
            return;
        }
        // Otherwise, return to the parent
        // $FlowFixMe[incompatible-type] we bail out when we get a null
        completedWork = returnFiber;
        // Update the next thing we're working on in case something throws.
        (0, react_fiber_work_in_progress_1.setWorkInProgress)(completedWork);
    } while (completedWork !== null);
    // We've reached the root.
    if ((0, react_fiber_work_in_progress_1.getWorkInProgressRootExitStatus)() === root_exit_status_1.RootExitStatus.RootInProgress) {
        (0, react_fiber_work_in_progress_1.setWorkInProgressRootExitStatus)(root_exit_status_1.RootExitStatus.RootCompleted);
    }
}
exports.completeUnitOfWork = completeUnitOfWork;
function unwindUnitOfWork(unitOfWork) {
    var incompleteWork = unitOfWork;
    do {
        // The current, flushed, state of this fiber is the alternate. Ideally
        // nothing should rely on this, but relying on it here means that we don't
        // need an additional field on the work in progress.
        var current = incompleteWork.alternate;
        // This fiber did not complete because something threw. Pop values off
        // the stack without entering the complete phase. If this is a boundary,
        // capture values if possible.
        var next = (0, react_fiber_unwind_work_1.unwindWork)(current, incompleteWork, (0, react_entangled_lane_1.getEntangledRenderLanes)());
        // Because this fiber did not complete, don't reset its lanes.
        if (next !== null) {
            // Found a boundary that can handle this exception. Re-renter the
            // begin phase. This branch will return us to the normal work loop.
            //
            // Since we're restarting, remove anything that is not a host effect
            // from the effect tag.
            next.flags &= fiber_flags_1.FiberFlags.HostEffectMask;
            (0, react_fiber_work_in_progress_1.setWorkInProgress)(next);
            return;
        }
        // Keep unwinding until we reach either a boundary or the root.
        if (react_feature_flags_1.enableProfilerTimer && (incompleteWork.mode & type_of_mode_1.TypeOfMode.ProfileMode) !== type_of_mode_1.TypeOfMode.NoMode) {
            // Record the render duration for the fiber that errored.
            (0, react_profile_timer_1.stopProfilerTimerIfRunningAndRecordDelta)(incompleteWork, false);
            // Include the time spent working on failed children before continuing.
            var actualDuration = incompleteWork.actualDuration;
            var child = incompleteWork.child;
            while (child !== null) {
                // $FlowFixMe[unsafe-addition] addition with possible null/undefined value
                // @ts-ignore
                actualDuration += child.actualDuration;
                child = child.sibling;
            }
            incompleteWork.actualDuration = actualDuration;
        }
        // TODO: Once we stop prerendering siblings, instead of resetting the parent
        // of the node being unwound, we should be able to reset node itself as we
        // unwind the stack. Saves an additional null check.
        var returnFiber = incompleteWork.return;
        if (returnFiber !== null) {
            // Mark the parent fiber as incomplete and clear its subtree flags.
            // TODO: Once we stop prerendering siblings, we may be able to get rid of
            // the Incomplete flag because unwinding to the nearest boundary will
            // happen synchronously.
            returnFiber.flags |= fiber_flags_1.FiberFlags.Incomplete;
            returnFiber.subtreeFlags = fiber_flags_1.FiberFlags.NoFlags;
            returnFiber.deletions = null;
        }
        // NOTE: If we re-enable sibling prerendering in some cases, here we
        // would switch to the normal completion path: check if a sibling
        // exists, and if so, begin work on it.
        // Otherwise, return to the parent
        // $FlowFixMe[incompatible-type] we bail out when we get a null
        incompleteWork = returnFiber;
        // Update the next thing we're working on in case something throws.
        (0, react_fiber_work_in_progress_1.setWorkInProgress)(incompleteWork);
    } while (incompleteWork !== null);
    // We've unwound all the way to the root.
    (0, react_fiber_work_in_progress_1.setWorkInProgressRootExitStatus)(root_exit_status_1.RootExitStatus.RootDidNotComplete);
    (0, react_fiber_work_in_progress_1.setWorkInProgress)(null);
}
function performUnitOfWork(unitOfWork) {
    // The current, flushed, state of this fiber is the alternate. Ideally
    // nothing should rely on this, but relying on it here means that we don't
    // need an additional field on the work in progress.
    var current = unitOfWork.alternate;
    (0, react_current_fiber_1.setCurrentFiber)(unitOfWork);
    var next;
    if (react_feature_flags_1.enableProfilerTimer && (unitOfWork.mode & type_of_mode_1.TypeOfMode.ProfileMode) !== type_of_mode_1.TypeOfMode.NoMode) {
        (0, react_profile_timer_1.startProfilerTimer)(unitOfWork);
        next = beginWork(current, unitOfWork, (0, react_entangled_lane_1.getEntangledRenderLanes)());
        (0, react_profile_timer_1.stopProfilerTimerIfRunningAndRecordDelta)(unitOfWork, true);
    }
    else {
        next = beginWork(current, unitOfWork, (0, react_entangled_lane_1.getEntangledRenderLanes)());
    }
    (0, react_current_fiber_1.resetCurrentFiber)();
    unitOfWork.memoizedProps = unitOfWork.pendingProps;
    if (next === null) {
        // If this doesn't spawn new work, complete the current work.
        completeUnitOfWork(unitOfWork);
    }
    else {
        (0, react_fiber_work_in_progress_1.setWorkInProgress)(next);
    }
    ReactCurrentOwner.current = null;
}
exports.performUnitOfWork = performUnitOfWork;
function replaySuspendedUnitOfWork(unitOfWork) {
    // This is a fork of performUnitOfWork specifcally for replaying a fiber that
    // just suspended.
    //
    var current = unitOfWork.alternate;
    (0, react_current_fiber_1.setCurrentFiber)(unitOfWork);
    var next;
    (0, react_current_fiber_1.setCurrentFiber)(unitOfWork);
    var isProfilingMode = react_feature_flags_1.enableProfilerTimer && (unitOfWork.mode & type_of_mode_1.TypeOfMode.ProfileMode) !== type_of_mode_1.TypeOfMode.NoMode;
    if (isProfilingMode) {
        (0, react_profile_timer_1.startProfilerTimer)(unitOfWork);
    }
    switch (unitOfWork.tag) {
        case work_tags_1.WorkTag.IndeterminateComponent: {
            // Because it suspended with `use`, we can assume it's a
            // function component.
            unitOfWork.tag = work_tags_1.WorkTag.FunctionComponent; // Fallthrough to the next branch.
        }
        case work_tags_1.WorkTag.SimpleMemoComponent:
        case work_tags_1.WorkTag.FunctionComponent: {
            // Resolve `defaultProps`. This logic is copied from `beginWork`.
            // TODO: Consider moving this switch statement into that module. Also,
            // could maybe use this as an opportunity to say `use` doesn't work with
            // `defaultProps` :)
            var Component = unitOfWork.type;
            var unresolvedProps = unitOfWork.pendingProps;
            var resolvedProps = unitOfWork.elementType === Component ? unresolvedProps : (0, react_fiber_lazy_component_1.resolveDefaultProps)(Component, unresolvedProps);
            var context = void 0;
            if (!react_feature_flags_1.disableLegacyContext) {
                var unmaskedContext = (0, react_fiber_context_1.getUnmaskedContext)(unitOfWork, Component, true);
                context = (0, react_fiber_context_1.getMaskedContext)(unitOfWork, unmaskedContext);
            }
            next = (0, react_fiber_work_begin_1.replayFunctionComponent)(current, unitOfWork, resolvedProps, Component, context, (0, react_fiber_work_in_progress_1.getWorkInProgressRootRenderLanes)());
            break;
        }
        case work_tags_1.WorkTag.ForwardRef: {
            // Resolve `defaultProps`. This logic is copied from `beginWork`.
            // TODO: Consider moving this switch statement into that module. Also,
            // could maybe use this as an opportunity to say `use` doesn't work with
            // `defaultProps` :)
            var Component = unitOfWork.type.render;
            var unresolvedProps = unitOfWork.pendingProps;
            var resolvedProps = unitOfWork.elementType === Component ? unresolvedProps : (0, react_fiber_lazy_component_1.resolveDefaultProps)(Component, unresolvedProps);
            next = (0, react_fiber_work_begin_1.replayFunctionComponent)(current, unitOfWork, resolvedProps, Component, unitOfWork.ref, (0, react_fiber_work_in_progress_1.getWorkInProgressRootRenderLanes)());
            break;
        }
        case work_tags_1.WorkTag.HostComponent: {
            // Some host components are stateful (that's how we implement form
            // actions) but we don't bother to reuse the memoized state because it's
            // not worth the extra code. The main reason to reuse the previous hooks
            // is to reuse uncached promises, but we happen to know that the only
            // promises that a host component might suspend on are definitely cached
            // because they are controlled by us. So don't bother.
            (0, react_fiber_hooks_unwind_1.resetHooksOnUnwind)(unitOfWork); // Fallthrough to the next branch.
        }
        default: {
            // Other types besides function components are reset completely before
            // being replayed. Currently this only happens when a Usable type is
            // reconciled — the reconciler will suspend.
            //
            // We reset the fiber back to its original state; however, this isn't
            // a full "unwind" because we're going to reuse the promises that were
            // reconciled previously. So it's intentional that we don't call
            // resetSuspendedWorkLoopOnUnwind here.
            (0, react_fiber_unwind_work_1.unwindInterruptedWork)(current, unitOfWork, (0, react_fiber_work_in_progress_1.getWorkInProgressRootRenderLanes)());
            // Original:
            // unitOfWork = WorkInProgress = resetWorkInProgress( unitOfWork, getEntangledRenderLanes() );
            (0, react_fiber_work_in_progress_1.setWorkInProgress)((0, react_fiber_work_in_progress_1.resetWorkInProgress)((0, react_fiber_work_in_progress_1.getWorkInProgressSafe)(), (0, react_entangled_lane_1.getEntangledRenderLanes)()));
            unitOfWork = (0, react_fiber_work_in_progress_1.getWorkInProgressSafe)();
            next = beginWork(current, unitOfWork, (0, react_entangled_lane_1.getEntangledRenderLanes)());
            break;
        }
    }
    if (isProfilingMode) {
        (0, react_profile_timer_1.stopProfilerTimerIfRunningAndRecordDelta)(unitOfWork, true);
    }
    // The begin phase finished successfully without suspending. Return to the
    // normal work loop.
    (0, react_current_fiber_1.resetCurrentFiber)();
    unitOfWork.memoizedProps = unitOfWork.pendingProps;
    if (next === null) {
        // If this doesn't spawn new work, complete the current work.
        completeUnitOfWork(unitOfWork);
    }
    else {
        (0, react_fiber_work_in_progress_1.setWorkInProgress)(next);
    }
    ReactCurrentOwner.current = null;
}
exports.replaySuspendedUnitOfWork = replaySuspendedUnitOfWork;
