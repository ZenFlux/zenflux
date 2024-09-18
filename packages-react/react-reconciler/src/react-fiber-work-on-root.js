"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_feature_flags_1 = require("@zenflux/react-shared/src/react-feature-flags");
var root_tags_1 = require("@zenflux/react-shared/src/react-internal-constants/root-tags");
var fiber_lane_constants_1 = require("@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants");
var react_fiber_lane_mark_root_1 = require("@zenflux/react-reconciler/src/react-fiber-lane-mark-root");
var react_fiber_root_scheduler_shared_1 = require("@zenflux/react-reconciler/src/react-fiber-root-scheduler-shared");
var react_fiber_work_excution_context_1 = require("@zenflux/react-reconciler/src/react-fiber-work-excution-context");
var react_fiber_work_in_progress_1 = require("@zenflux/react-reconciler/src/react-fiber-work-in-progress");
var react_fiber_work_in_progress_prepare_fresh_stack_1 = require("@zenflux/react-reconciler/src/react-fiber-work-in-progress-prepare-fresh-stack");
var react_fiber_work_on_root_commit_1 = require("@zenflux/react-reconciler/src/react-fiber-work-on-root-commit");
var react_fiber_work_on_root_concurrent_recover_1 = require("@zenflux/react-reconciler/src/react-fiber-work-on-root-concurrent-recover");
var react_fiber_work_on_root_render_root_1 = require("@zenflux/react-reconciler/src/react-fiber-work-on-root-render-root");
var react_fiber_work_passive_effects_1 = require("@zenflux/react-reconciler/src/react-fiber-work-passive-effects");
var react_fiber_lane_1 = require("@zenflux/react-reconciler/src/react-fiber-lane");
var react_profile_timer_1 = require("@zenflux/react-reconciler/src/react-profile-timer");
var react_fiber_work_on_root_shared_1 = require("@zenflux/react-reconciler/src/react-fiber-work-on-root-shared");
var root_exit_status_1 = require("@zenflux/react-reconciler/src/root-exit-status");
react_fiber_work_on_root_shared_1.ReactFiberWorkOnRootShared.flushSyncWorkOnAllRoots = flushSyncWorkOnAllRoots;
react_fiber_work_on_root_shared_1.ReactFiberWorkOnRootShared.flushSyncWorkOnLegacyRootsOnly = flushSyncWorkOnLegacyRootsOnly;
// ---
// This is the entry point for synchronous tasks that don't go
// through Scheduler
function performSyncWorkOnRoot(root, lanes) {
    if ((0, react_fiber_work_excution_context_1.isExecutionContextRenderOrCommitDeactivate)()) {
        throw new Error("Should not already be working.");
    }
    var didFlushPassiveEffects = (0, react_fiber_work_passive_effects_1.flushPassiveEffects)();
    if (didFlushPassiveEffects) {
        // If passive effects were flushed, exit to the outer work loop in the root
        // scheduler, so we can recompute the priority.
        // TODO: We don't actually need this `ensureRootIsScheduled` call because
        // this path is only reachable if the root is already part of the schedule.
        // I'm including it only for consistency with the other exit points from
        // this function. Can address in a subsequent refactor.
        react_fiber_root_scheduler_shared_1.ReactFiberRootSchedulerShared.ensureRootScheduled(root);
        return null;
    }
    if (react_feature_flags_1.enableProfilerTimer && react_feature_flags_1.enableProfilerNestedUpdatePhase) {
        (0, react_profile_timer_1.syncNestedUpdateFlag)();
    }
    // Next calls will set `root.current.subtreeFlags`
    var exitStatus = (0, react_fiber_work_on_root_render_root_1.renderRootSync)(root, lanes);
    if (root.tag !== root_tags_1.LegacyRoot && exitStatus === root_exit_status_1.RootExitStatus.RootErrored) {
        // If something threw an error, try rendering one more time. We'll render
        // synchronously to block concurrent data mutations, and we'll includes
        // all pending updates are included. If it still fails after the second
        // attempt, we'll give up and commit the resulting tree.
        var originallyAttemptedLanes = lanes;
        var errorRetryLanes = (0, react_fiber_lane_1.getLanesToRetrySynchronouslyOnError)(root, originallyAttemptedLanes);
        if (errorRetryLanes !== fiber_lane_constants_1.NoLanes) {
            lanes = errorRetryLanes;
            exitStatus = (0, react_fiber_work_on_root_concurrent_recover_1.recoverFromConcurrentError)(root, originallyAttemptedLanes, errorRetryLanes);
        }
    }
    if (exitStatus === root_exit_status_1.RootExitStatus.RootFatalErrored) {
        var fatalError = (0, react_fiber_work_in_progress_1.getWorkInProgressRootFatalError)();
        (0, react_fiber_work_in_progress_prepare_fresh_stack_1.prepareWorkInProgressFreshStack)(root, fiber_lane_constants_1.NoLanes);
        (0, react_fiber_lane_mark_root_1.markRootSuspended)(root, lanes, fiber_lane_constants_1.NoLane);
        react_fiber_root_scheduler_shared_1.ReactFiberRootSchedulerShared.ensureRootScheduled(root);
        throw fatalError;
    }
    if (exitStatus === root_exit_status_1.RootExitStatus.RootDidNotComplete) {
        // The render unwound without completing the tree. This happens in special
        // cases where need to exit the current render without producing a
        // consistent tree or committing.
        (0, react_fiber_lane_mark_root_1.markRootSuspended)(root, lanes, fiber_lane_constants_1.NoLane);
        react_fiber_root_scheduler_shared_1.ReactFiberRootSchedulerShared.ensureRootScheduled(root);
        return null;
    }
    // We now have a consistent tree. Because this is a sync render, we
    // will commit it even if something suspended.
    var finishedWork = root.current.alternate;
    root.finishedWork = finishedWork;
    root.finishedLanes = lanes;
    (0, react_fiber_work_on_root_commit_1.commitRoot)(root, (0, react_fiber_work_in_progress_1.getWorkInProgressRootRecoverableErrors)(), (0, react_fiber_work_in_progress_1.getWorkInProgressTransitions)(), (0, react_fiber_work_in_progress_1.getWorkInProgressDeferredLane)());
    // Before exiting, make sure there's a callback scheduled for the next
    // pending level.
    react_fiber_root_scheduler_shared_1.ReactFiberRootSchedulerShared.ensureRootScheduled(root);
    return null;
}
function flushSyncWorkOnAllRoots() {
    // This is allowed to be called synchronously, but the caller should check
    // the execution context first.
    flushSyncWorkAcrossRoots_impl(false);
}
function flushSyncWorkOnLegacyRootsOnly() {
    // This is allowed to be called synchronously, but the caller should check
    // the execution context first.
    flushSyncWorkAcrossRoots_impl(true);
}
function throwError(error) {
    throw error;
}
function flushSyncWorkAcrossRoots_impl(onlyLegacy) {
    if (react_fiber_work_on_root_shared_1.ReactFiberWorkOnRootShared.isFlushingWork()) {
        // Prevent reentrancy.
        // TODO: Is this overly defensive? The callers must check the execution
        // context first regardless.
        return;
    }
    if (!react_fiber_work_on_root_shared_1.ReactFiberWorkOnRootShared.hasPendingSyncWork()) {
        // Fast path. There's no sync work to do.
        return;
    }
    // There may or may not be synchronous work scheduled. Let's check.
    var didPerformSomeWork;
    var errors = null;
    react_fiber_work_on_root_shared_1.ReactFiberWorkOnRootShared.setIsFlushingOnWork();
    do {
        didPerformSomeWork = false;
        var root = react_fiber_root_scheduler_shared_1.ReactFiberRootSchedulerShared.firstScheduledRoot;
        while (root !== null) {
            if (onlyLegacy && root.tag !== root_tags_1.LegacyRoot) { // Skip non-legacy roots.
            }
            else {
                var workInProgressRoot = (0, react_fiber_work_in_progress_1.getWorkInProgressRoot)();
                var workInProgressRootRenderLanes = (0, react_fiber_work_in_progress_1.getWorkInProgressRootRenderLanes)();
                var nextLanes = (0, react_fiber_lane_1.getNextLanes)(root, root === workInProgressRoot ? workInProgressRootRenderLanes : fiber_lane_constants_1.NoLanes);
                if ((0, fiber_lane_constants_1.includesSyncLane)(nextLanes)) {
                    // This root has pending sync work. Flush it now.
                    try {
                        didPerformSomeWork = true;
                        performSyncWorkOnRoot(root, nextLanes);
                    }
                    catch (error) {
                        // Collect errors so we can rethrow them at the end
                        if (errors === null) {
                            errors = [error];
                        }
                        else {
                            errors.push(error);
                        }
                    }
                }
            }
            root = root.next;
        }
    } while (didPerformSomeWork);
    react_fiber_work_on_root_shared_1.ReactFiberWorkOnRootShared.unsetIsFlushingOnWork();
    // If any errors were thrown, rethrow them right before exiting.
    // TODO: Consider returning these to the caller, to allow them to decide
    // how/when to rethrow.
    if (errors !== null) {
        if (errors.length > 1) {
            if (typeof AggregateError === "function") {
                // eslint-disable-next-line no-undef
                throw new AggregateError(errors);
            }
            else {
                for (var i = 1; i < errors.length; i++) {
                    react_fiber_root_scheduler_shared_1.ReactFiberRootSchedulerShared.scheduleImmediateTask(throwError.bind(null, errors[i]));
                }
                throw errors[0];
            }
        }
        else {
            throw errors[0];
        }
    }
}
