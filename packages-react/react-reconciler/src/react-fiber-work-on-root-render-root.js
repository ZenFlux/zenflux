"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderRootSync = void 0;
var react_feature_flags_1 = require("@zenflux/react-shared/src/react-feature-flags");
var fiber_lane_constants_1 = require("@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants");
var react_debug_tracing_1 = require("@zenflux/react-reconciler/src/react-debug-tracing");
var react_fiber_commit_work_1 = require("@zenflux/react-reconciler/src/react-fiber-commit-work");
var react_fiber_concurrent_updates_1 = require("@zenflux/react-reconciler/src/react-fiber-concurrent-updates");
var react_fiber_dev_tools_hook_1 = require("@zenflux/react-reconciler/src/react-fiber-dev-tools-hook");
var react_fiber_lane_1 = require("@zenflux/react-reconciler/src/react-fiber-lane");
var react_fiber_new_context_1 = require("@zenflux/react-reconciler/src/react-fiber-new-context");
var react_fiber_suspense_context_1 = require("@zenflux/react-reconciler/src/react-fiber-suspense-context");
var react_fiber_work_excution_context_1 = require("@zenflux/react-reconciler/src/react-fiber-work-excution-context");
var react_fiber_work_in_progress_1 = require("@zenflux/react-reconciler/src/react-fiber-work-in-progress");
var react_fiber_work_in_progress_ex_1 = require("@zenflux/react-reconciler/src/react-fiber-work-in-progress-ex");
var react_fiber_work_in_progress_prepare_fresh_stack_1 = require("@zenflux/react-reconciler/src/react-fiber-work-in-progress-prepare-fresh-stack");
var react_fiber_work_on_root_dispatcher_1 = require("@zenflux/react-reconciler/src/react-fiber-work-on-root-dispatcher");
var react_fiber_work_on_root_handle_throw_1 = require("@zenflux/react-reconciler/src/react-fiber-work-on-root-handle-throw");
var react_fiber_work_on_root_loop_1 = require("@zenflux/react-reconciler/src/react-fiber-work-on-root-loop");
var react_suspended_reason_1 = require("@zenflux/react-reconciler/src/react-suspended-reason");
var root_exit_status_1 = require("@zenflux/react-reconciler/src/root-exit-status");
// TODO: Over time, this function and renderRootConcurrent have become more
// and more similar. Not sure it makes sense to maintain forked paths. Consider
// unifying them again.
function renderRootSync(root, lanes) {
    var prevExecutionContext = (0, react_fiber_work_excution_context_1.getExecutionContext)();
    (0, react_fiber_work_excution_context_1.activateRenderExecutionContext)();
    var prevDispatcher = (0, react_fiber_work_on_root_dispatcher_1.pushDispatcher)(root.containerInfo);
    var prevCacheDispatcher = (0, react_fiber_work_on_root_dispatcher_1.pushCacheDispatcher)();
    // If the root or lanes have changed, throw out the existing stack
    // and prepare a fresh one. Otherwise we'll continue where we left off.
    if ((0, react_fiber_work_in_progress_1.getWorkInProgressRoot)() !== root || (0, react_fiber_work_in_progress_1.getWorkInProgressRootRenderLanes)() !== lanes) {
        if (react_feature_flags_1.enableUpdaterTracking) {
            if (react_fiber_dev_tools_hook_1.isDevToolsPresent) {
                var memoizedUpdaters = root.memoizedUpdaters;
                if (memoizedUpdaters.size > 0) {
                    (0, react_fiber_commit_work_1.restorePendingUpdaters)(root, (0, react_fiber_work_in_progress_1.getWorkInProgressRootRenderLanes)());
                    memoizedUpdaters.clear();
                }
                // At this point, move Fibers that scheduled the upcoming work from the Map to the Set.
                // If we bailout on this work, we'll move them back (like above).
                // It's important to move them now in case the work spawns more work at the same priority with different updaters.
                // That way we can keep the current update and future updates separate.
                (0, react_fiber_lane_1.movePendingFibersToMemoized)(root, lanes);
            }
        }
        (0, react_fiber_work_in_progress_1.setWorkInProgressTransitions)((0, react_fiber_lane_1.getTransitionsForLanes)(root, lanes));
        (0, react_fiber_work_in_progress_prepare_fresh_stack_1.prepareWorkInProgressFreshStack)(root, lanes);
    }
    if (__DEV__) {
        if (react_feature_flags_1.enableDebugTracing) {
            (0, react_debug_tracing_1.logRenderStarted)(lanes);
        }
    }
    if (react_feature_flags_1.enableSchedulingProfiler) {
        (0, react_fiber_dev_tools_hook_1.markRenderStarted)(lanes);
    }
    var didSuspendInShell = false;
    outer: do {
        try {
            if ((0, react_fiber_work_in_progress_1.getWorkInProgressSuspendedReason)() !== react_suspended_reason_1.SuspendedReason.NotSuspended && (0, react_fiber_work_in_progress_1.getWorkInProgress)() !== null) {
                // The work loop is suspended. During a synchronous render, we don't
                // yield to the main thread. Immediately unwind the stack. This will
                // trigger either a fallback or an error boundary.
                // TODO: For discrete and "default" updates (anything that's not
                // flushSync), we want to wait for the microtasks the flush before
                // unwinding. Will probably implement this using renderRootConcurrent,
                // or merge renderRootSync and renderRootConcurrent into the same
                // function and fork the behavior some other way.
                var unitOfWork = (0, react_fiber_work_in_progress_1.getWorkInProgressSafe)();
                var thrownValue = (0, react_fiber_work_in_progress_1.getWorkInProgressThrownValue)();
                switch ((0, react_fiber_work_in_progress_1.getWorkInProgressSuspendedReason)()) {
                    case react_suspended_reason_1.SuspendedReason.SuspendedOnHydration: {
                        // Selective hydration. An update flowed into a dehydrated tree.
                        // Interrupt the current render so the work loop can switch to the
                        // hydration lane.
                        (0, react_fiber_work_in_progress_ex_1.resetWorkInProgressStack)();
                        (0, react_fiber_work_in_progress_1.setWorkInProgressRootExitStatus)(root_exit_status_1.RootExitStatus.RootDidNotComplete);
                        break outer;
                    }
                    case react_suspended_reason_1.SuspendedReason.SuspendedOnImmediate:
                    case react_suspended_reason_1.SuspendedReason.SuspendedOnData: {
                        if (!didSuspendInShell && (0, react_fiber_suspense_context_1.getSuspenseHandler)() === null) {
                            didSuspendInShell = true;
                        } // Intentional fallthrough
                    }
                    default: {
                        // Unwind then continue with the normal work loop.
                        (0, react_fiber_work_in_progress_1.setWorkInProgressSuspendedReason)(react_suspended_reason_1.SuspendedReason.NotSuspended);
                        (0, react_fiber_work_in_progress_1.setWorkInProgressThrownValue)(null);
                        (0, react_fiber_work_on_root_loop_1.throwAndUnwindWorkLoop)(unitOfWork, thrownValue);
                        break;
                    }
                }
            }
            (0, react_fiber_work_on_root_loop_1.workLoopSync)();
            break;
        }
        catch (thrownValue) {
            (0, react_fiber_work_on_root_handle_throw_1.handleThrow)(root, thrownValue);
        }
    } while (true);
    // Check if something suspended in the shell. We use this to detect an
    // infinite ping loop caused by an uncached promise.
    //
    // Only increment this counter once per synchronous render attempt across the
    // whole tree. Even if there are many sibling components that suspend, this
    // counter only gets incremented once.
    if (didSuspendInShell) {
        root.shellSuspendCounter++;
    }
    (0, react_fiber_new_context_1.resetContextDependencies)();
    (0, react_fiber_work_excution_context_1.setExecutionContext)(prevExecutionContext);
    (0, react_fiber_work_on_root_dispatcher_1.popDispatcher)(prevDispatcher);
    (0, react_fiber_work_on_root_dispatcher_1.popCacheDispatcher)(prevCacheDispatcher);
    if ((0, react_fiber_work_in_progress_1.getWorkInProgress)() !== null) {
        // This is a sync render, so we should have finished the whole tree.
        throw new Error("Cannot commit an incomplete root. This error is likely caused by a " + "bug in React. Please file an issue.");
    }
    if (__DEV__) {
        if (react_feature_flags_1.enableDebugTracing) {
            (0, react_debug_tracing_1.logRenderStopped)();
        }
    }
    if (react_feature_flags_1.enableSchedulingProfiler) {
        (0, react_fiber_dev_tools_hook_1.markRenderStopped)();
    }
    // Set this to null to indicate there's no in-progress render.
    (0, react_fiber_work_in_progress_1.setWorkInProgressRoot)(null);
    (0, react_fiber_work_in_progress_1.setWorkInProgressRootRenderLanes)(fiber_lane_constants_1.NoLanes);
    // It's safe to process the queue now that the render phase is complete.
    (0, react_fiber_concurrent_updates_1.finishQueueingConcurrentUpdates)();
    return (0, react_fiber_work_in_progress_1.getWorkInProgressRootExitStatus)();
}
exports.renderRootSync = renderRootSync;
