"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.attachPingListener = exports.renderHasNotSuspendedYet = void 0;
var react_feature_flags_1 = require("@zenflux/react-shared/src/react-feature-flags");
var react_shared_internals_1 = require("@zenflux/react-shared/src/react-shared-internals");
var fiber_lane_constants_1 = require("@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants");
var root_tags_1 = require("@zenflux/react-shared/src/react-internal-constants/root-tags");
var react_fiber_act_1 = require("@zenflux/react-reconciler/src/react-fiber-act");
var react_fiber_commit_work_1 = require("@zenflux/react-reconciler/src/react-fiber-commit-work");
var react_fiber_dev_tools_hook_1 = require("@zenflux/react-reconciler/src/react-fiber-dev-tools-hook");
var react_fiber_lane_1 = require("@zenflux/react-reconciler/src/react-fiber-lane");
var react_fiber_lane_mark_root_1 = require("@zenflux/react-reconciler/src/react-fiber-lane-mark-root");
var react_fiber_root_scheduler_shared_1 = require("@zenflux/react-reconciler/src/react-fiber-root-scheduler-shared");
var react_fiber_work_excution_context_1 = require("@zenflux/react-reconciler/src/react-fiber-work-excution-context");
var react_fiber_work_in_progress_1 = require("@zenflux/react-reconciler/src/react-fiber-work-in-progress");
var react_fiber_work_in_progress_prepare_fresh_stack_1 = require("@zenflux/react-reconciler/src/react-fiber-work-in-progress-prepare-fresh-stack");
var react_fiber_work_most_recent_fallback_time_1 = require("@zenflux/react-reconciler/src/react-fiber-work-most-recent-fallback-time");
var root_exit_status_1 = require("@zenflux/react-reconciler/src/root-exit-status");
var PossiblyWeakMap = typeof WeakMap === "function" ? WeakMap : Map;
var ReactCurrentActQueue = react_shared_internals_1.default.ReactCurrentActQueue;
function warnIfSuspenseResolutionNotWrappedWithActDEV(root) {
    if (__DEV__) {
        if (root.tag !== root_tags_1.LegacyRoot && (0, react_fiber_act_1.isConcurrentActEnvironment)() && ReactCurrentActQueue.current === null) {
            console.error("A suspended resource finished loading inside a test, but the event " + "was not wrapped in act(...).\n\n" + "When testing, code that resolves suspended data should be wrapped " + "into act(...):\n\n" + "act(() => {\n" + "  /* finish loading suspended data */\n" + "});\n" + "/* assert on the output */\n\n" + "This ensures that you're testing the behavior the user would see " + "in the browser." + " Learn more at https://reactjs.org/link/wrap-tests-with-act");
        }
    }
}
// Called during render to determine if anything has suspended.
// Returns false if we're not sure.
function renderHasNotSuspendedYet() {
    // If something errored or completed, we can't really be sure,
    // so those are false.
    return (0, react_fiber_work_in_progress_1.getWorkInProgressRootExitStatus)() === root_exit_status_1.RootExitStatus.RootInProgress;
}
exports.renderHasNotSuspendedYet = renderHasNotSuspendedYet;
function attachPingListener(root, wakeable, lanes) {
    // Attach a ping listener
    //
    // The data might resolve before we have a chance to commit the fallback. Or,
    // in the case of a refresh, we'll never commit a fallback. So we need to
    // attach a listener now. When it resolves ("pings"), we can decide whether to
    // try rendering the tree again.
    //
    // Only attach a listener if one does not already exist for the lanes
    // we're currently rendering (which acts like a "thread ID" here).
    //
    // We only need to do this in concurrent mode. Legacy Suspense always
    // commits fallbacks synchronously, so there are no pings.
    var pingCache = root.pingCache;
    var threadIDs;
    if (pingCache === null) {
        pingCache = root.pingCache = new PossiblyWeakMap();
        threadIDs = new Set();
        pingCache.set(wakeable, threadIDs);
    }
    else {
        threadIDs = pingCache.get(wakeable);
        if (threadIDs === undefined) {
            threadIDs = new Set();
            pingCache.set(wakeable, threadIDs);
        }
    }
    if (!threadIDs.has(lanes)) {
        (0, react_fiber_work_in_progress_1.setWorkInProgressRootDidAttachPingListener)(true);
        // Memoize using the thread ID to prevent redundant listeners.
        threadIDs.add(lanes);
        var ping = pingSuspendedRoot.bind(null, root, wakeable, lanes);
        if (react_feature_flags_1.enableUpdaterTracking) {
            if (react_fiber_dev_tools_hook_1.isDevToolsPresent) {
                // If we have pending work still, restore the original updaters
                (0, react_fiber_commit_work_1.restorePendingUpdaters)(root, lanes);
            }
        }
        wakeable.then(ping, ping);
    }
}
exports.attachPingListener = attachPingListener;
function pingSuspendedRoot(root, wakeable, pingedLanes) {
    var pingCache = root.pingCache;
    if (pingCache !== null) {
        // The wake-able resolved, so we no longer need to memoize, because it will
        // never be thrown again.
        pingCache.delete(wakeable);
    }
    (0, react_fiber_lane_mark_root_1.markRootPinged)(root, pingedLanes);
    warnIfSuspenseResolutionNotWrappedWithActDEV(root);
    if ((0, react_fiber_work_in_progress_1.getWorkInProgressRoot)() === root && (0, react_fiber_lane_1.isSubsetOfLanes)((0, react_fiber_work_in_progress_1.getWorkInProgressRootRenderLanes)(), pingedLanes)) {
        // Received a ping at the same priority level at which we're currently
        // rendering. We might want to restart this render. This should mirror
        // the logic of whether or not a root suspends once it completes.
        // TODO: If we're rendering sync either due to Sync, Batched or expired,
        // we should probably never restart.
        // If we're suspended with delay, or if it's a retry, we'll always suspend
        // so we can always restart.
        if ((0, react_fiber_work_in_progress_1.getWorkInProgressRootExitStatus)() === root_exit_status_1.RootExitStatus.RootSuspendedWithDelay ||
            (0, react_fiber_work_in_progress_1.getWorkInProgressRootExitStatus)() === root_exit_status_1.RootExitStatus.RootSuspended &&
                (0, fiber_lane_constants_1.includesOnlyRetries)((0, react_fiber_work_in_progress_1.getWorkInProgressRootRenderLanes)()) && (0, react_fiber_work_most_recent_fallback_time_1.isGlobalMostRecentFallbackNotExceeded)()) {
            // Force a restart from the root by unwinding the stack. Unless this is
            // being called from the render phase, because that would cause a crash.
            if ((0, react_fiber_work_excution_context_1.isExecutionContextRenderActivate)()) {
                (0, react_fiber_work_in_progress_prepare_fresh_stack_1.prepareWorkInProgressFreshStack)(root, fiber_lane_constants_1.NoLanes);
            }
            else { // TODO: If this does happen during the render phase, we should throw
                // the special internal exception that we use to interrupt the stack for
                // selective hydration. That was temporarily reverted but we once we add
                // it back we can use it here.
            }
        }
        else {
            // Even though we can't restart right now, we might get an
            // opportunity later. So we mark this render as having a ping.
            (0, react_fiber_work_in_progress_1.setWorkInProgressRootPingedLanes)((0, react_fiber_lane_1.mergeLanes)((0, react_fiber_work_in_progress_1.getWorkInProgressRootPingedLanes)(), pingedLanes));
        }
    }
    react_fiber_root_scheduler_shared_1.ReactFiberRootSchedulerShared.ensureRootScheduled(root);
}
