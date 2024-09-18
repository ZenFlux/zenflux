"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleThrow = void 0;
var react_feature_flags_1 = require("@zenflux/react-shared/src/react-feature-flags");
var react_shared_internals_1 = require("@zenflux/react-shared/src/react-shared-internals");
var type_of_mode_1 = require("@zenflux/react-shared/src/react-internal-constants/type-of-mode");
var fiber_lane_constants_1 = require("@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants");
var react_current_fiber_1 = require("@zenflux/react-reconciler/src/react-current-fiber");
var react_fiber_dev_tools_hook_1 = require("@zenflux/react-reconciler/src/react-fiber-dev-tools-hook");
var react_fiber_hooks_1 = require("@zenflux/react-reconciler/src/react-fiber-hooks");
var react_fiber_thenable_1 = require("@zenflux/react-reconciler/src/react-fiber-thenable");
var react_fiber_work_in_progress_1 = require("@zenflux/react-reconciler/src/react-fiber-work-in-progress");
var react_fiber_work_loop_should_on_previous_screen_1 = require("@zenflux/react-reconciler/src/react-fiber-work-loop-should-on-previous-screen");
var react_fiber_work_selective_hydration_exception_1 = require("@zenflux/react-reconciler/src/react-fiber-work-selective-hydration-exception");
var react_profile_timer_1 = require("@zenflux/react-reconciler/src/react-profile-timer");
var react_suspended_reason_1 = require("@zenflux/react-reconciler/src/react-suspended-reason");
var root_exit_status_1 = require("@zenflux/react-reconciler/src/root-exit-status");
var ReactCurrentOwner = react_shared_internals_1.default.ReactCurrentOwner;
function handleThrow(root, thrownValue) {
    // A component threw an exception. Usually this is because it suspended, but
    // it also includes regular program errors.
    //
    // We're either going to unwind the stack to show a Suspense or error
    // boundary, or we're going to replay the component again. Like after a
    // promise resolves.
    //
    // Until we decide whether we're going to unwind or replay, we should preserve
    // the current state of the work loop without resetting anything.
    //
    // If we do decide to unwind the stack, module-level variables will be reset
    // in resetSuspendedWorkLoopOnUnwind.
    // These should be reset immediately because they're only supposed to be set
    // when React is executing user code.
    (0, react_fiber_hooks_1.resetHooksAfterThrow)();
    (0, react_current_fiber_1.resetCurrentFiber)();
    ReactCurrentOwner.current = null;
    if (thrownValue === react_fiber_thenable_1.SuspenseException) {
        // This is a special type of exception used for Suspense. For historical
        // reasons, the rest of the Suspense implementation expects the thrown value
        // to be a thenable, because before `use` existed that was the (unstable)
        // API for suspending. This implementation detail can change later, once we
        // deprecate the old API in favor of `use`.
        thrownValue = (0, react_fiber_thenable_1.getSuspendedThenable)();
        (0, react_fiber_work_in_progress_1.setWorkInProgressSuspendedReason)((0, react_fiber_work_loop_should_on_previous_screen_1.shouldRemainOnPreviousScreen)() && // Check if there are other pending updates that might possibly unblock this
            // component from suspending. This mirrors the check in
            // renderDidSuspendDelayIfPossible. We should attempt to unify them somehow.
            // TODO: Consider unwinding immediately, using the
            // SuspendedOnHydration mechanism.
            !(0, fiber_lane_constants_1.includesNonIdleWork)((0, react_fiber_work_in_progress_1.getWorkInProgressRootSkippedLanes)()) &&
            !(0, fiber_lane_constants_1.includesNonIdleWork)((0, react_fiber_work_in_progress_1.getWorkInProgressRootInterleavedUpdatedLanes)()) ? // Suspend work loop until data resolves
            react_suspended_reason_1.SuspendedReason.SuspendedOnData : // Don't suspend work loop, except to check if the data has
            // immediately resolved (i.e. in a microtask). Otherwise, trigger the
            // nearest Suspense fallback.
            react_suspended_reason_1.SuspendedReason.SuspendedOnImmediate);
    }
    else if (thrownValue === react_fiber_thenable_1.SuspenseyCommitException) {
        thrownValue = (0, react_fiber_thenable_1.getSuspendedThenable)();
        (0, react_fiber_work_in_progress_1.setWorkInProgressSuspendedReason)(react_suspended_reason_1.SuspendedReason.SuspendedOnInstance);
    }
    else if (thrownValue === react_fiber_work_selective_hydration_exception_1.SelectiveHydrationException) {
        // An update flowed into a dehydrated boundary. Before we can apply the
        // update, we need to finish hydrating. Interrupt the work-in-progress
        // render so we can restart at the hydration lane.
        //
        // The ideal implementation would be able to switch contexts without
        // unwinding the current stack.
        //
        // We could name this something more general but as of now it's the only
        // case where we think this should happen.
        (0, react_fiber_work_in_progress_1.setWorkInProgressSuspendedReason)(react_suspended_reason_1.SuspendedReason.SuspendedOnHydration);
    }
    else {
        // This is a regular error.
        var isWakeable = thrownValue !== null && typeof thrownValue === "object" && typeof thrownValue.then === "function";
        (0, react_fiber_work_in_progress_1.setWorkInProgressSuspendedReason)(isWakeable ? // A wakeable object was thrown by a legacy Suspense implementation.
            // This has slightly different behavior than suspending with `use`.
            react_suspended_reason_1.SuspendedReason.SuspendedOnDeprecatedThrowPromise : // This is a regular error. If something earlier in the component already
            // suspended, we must clear the thenable state to unblock the work loop.
            react_suspended_reason_1.SuspendedReason.SuspendedOnError);
    }
    (0, react_fiber_work_in_progress_1.setWorkInProgressThrownValue)(thrownValue);
    var erroredWork = (0, react_fiber_work_in_progress_1.getWorkInProgress)();
    if (erroredWork === null) {
        // This is a fatal error
        (0, react_fiber_work_in_progress_1.setWorkInProgressRootExitStatus)(root_exit_status_1.RootExitStatus.RootFatalErrored);
        (0, react_fiber_work_in_progress_1.setWorkInProgressRootFatalError)(thrownValue);
        return;
    }
    if (react_feature_flags_1.enableProfilerTimer && erroredWork.mode & type_of_mode_1.TypeOfMode.ProfileMode) {
        // Record the time spent rendering before an error was thrown. This
        // avoids inaccurate Profiler durations in the case of a
        // suspended render.
        (0, react_profile_timer_1.stopProfilerTimerIfRunningAndRecordDelta)(erroredWork, true);
    }
    if (react_feature_flags_1.enableSchedulingProfiler) {
        (0, react_fiber_dev_tools_hook_1.markComponentRenderStopped)();
        switch ((0, react_fiber_work_in_progress_1.getWorkInProgressSuspendedReason)()) {
            case react_suspended_reason_1.SuspendedReason.SuspendedOnError: {
                (0, react_fiber_dev_tools_hook_1.markComponentErrored)(erroredWork, thrownValue, (0, react_fiber_work_in_progress_1.getWorkInProgressRootRenderLanes)());
                break;
            }
            case react_suspended_reason_1.SuspendedReason.SuspendedOnData:
            case react_suspended_reason_1.SuspendedReason.SuspendedOnImmediate:
            case react_suspended_reason_1.SuspendedReason.SuspendedOnDeprecatedThrowPromise:
            case react_suspended_reason_1.SuspendedReason.SuspendedAndReadyToContinue: {
                var wakeable = thrownValue;
                (0, react_fiber_dev_tools_hook_1.markComponentSuspended)(erroredWork, wakeable, (0, react_fiber_work_in_progress_1.getWorkInProgressRootRenderLanes)());
                break;
            }
            case react_suspended_reason_1.SuspendedReason.SuspendedOnInstance: {
                // This is conceptually like a suspend, but it's not associated with
                // a particular wakeable. It's associated with a host resource (e.g.
                // a CSS file or an image) that hasn't loaded yet. DevTools doesn't
                // handle this currently.
                break;
            }
            case react_suspended_reason_1.SuspendedReason.SuspendedOnHydration: {
                // This is conceptually like a suspend, but it's not associated with
                // a particular wakeable. DevTools doesn't seem to care about this case,
                // currently. It's similar to if the component were interrupted, which
                // we don't mark with a special function.
                break;
            }
        }
    }
}
exports.handleThrow = handleThrow;
