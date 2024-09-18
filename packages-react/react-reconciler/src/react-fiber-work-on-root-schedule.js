"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduleTaskForRootDuringMicrotask = exports.scheduleImmediateTask = exports.ensureRootScheduled = void 0;
var react_scheduler_1 = require("@zenflux/react-scheduler");
var react_feature_flags_1 = require("@zenflux/react-shared/src/react-feature-flags");
var react_shared_internals_1 = require("@zenflux/react-shared/src/react-shared-internals");
var root_tags_1 = require("@zenflux/react-shared/src/react-internal-constants/root-tags");
var fiber_lane_constants_1 = require("@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants");
var react_fiber_work_on_root_shared_1 = require("@zenflux/react-reconciler/src/react-fiber-work-on-root-shared");
var react_fiber_work_excution_context_1 = require("@zenflux/react-reconciler/src/react-fiber-work-excution-context");
var react_fiber_lane_1 = require("@zenflux/react-reconciler/src/react-fiber-lane");
var react_fiber_work_in_progress_1 = require("@zenflux/react-reconciler/src/react-fiber-work-in-progress");
var react_event_priorities_1 = require("@zenflux/react-reconciler/src/react-event-priorities");
var react_fiber_root_scheduler_shared_1 = require("@zenflux/react-reconciler/src/react-fiber-root-scheduler-shared");
var react_fiber_work_on_root_concurrent_1 = require("@zenflux/react-reconciler/src/react-fiber-work-on-root-concurrent");
var _a = globalThis.__RECONCILER__CONFIG__, supportsMicrotasks = _a.supportsMicrotasks, scheduleMicrotask = _a.scheduleMicrotask, shouldAttemptEagerTransition = _a.shouldAttemptEagerTransition;
var ReactCurrentActQueue = react_shared_internals_1.default.ReactCurrentActQueue;
var fakeActCallbackNode = {};
react_fiber_root_scheduler_shared_1.ReactFiberRootSchedulerShared.ensureRootScheduled = ensureRootScheduled;
react_fiber_root_scheduler_shared_1.ReactFiberRootSchedulerShared.scheduleImmediateTask = scheduleImmediateTask;
react_fiber_root_scheduler_shared_1.ReactFiberRootSchedulerShared.scheduleTaskForRootDuringMicrotask = scheduleTaskForRootDuringMicrotask;
// ---
function processRootScheduleInMicrotask() {
    // This function is always called inside a microtask. It should never be
    // called synchronously.
    react_fiber_root_scheduler_shared_1.ReactFiberRootSchedulerShared.didScheduleMicrotask = false;
    if (__DEV__) {
        react_fiber_root_scheduler_shared_1.ReactFiberRootSchedulerShared.didScheduleMicrotask_act = false;
    }
    // We'll recompute this as we iterate through all the roots and schedule them.
    react_fiber_work_on_root_shared_1.ReactFiberWorkOnRootShared.unsetHavePendingSyncWork();
    var currentTime = (0, react_scheduler_1.unstable_now)();
    var prev = null;
    var root = react_fiber_root_scheduler_shared_1.ReactFiberRootSchedulerShared.firstScheduledRoot;
    while (root !== null) {
        var next = root.next;
        if (react_fiber_root_scheduler_shared_1.ReactFiberRootSchedulerShared.currentEventTransitionLane !== fiber_lane_constants_1.NoLane && shouldAttemptEagerTransition()) {
            // A transition was scheduled during an event, but we're going to try to
            // render it synchronously anyway. We do this during a popstate event to
            // preserve the scroll position of the previous page.
            (0, react_fiber_lane_1.upgradePendingLaneToSync)(root, react_fiber_root_scheduler_shared_1.ReactFiberRootSchedulerShared.currentEventTransitionLane);
        }
        var nextLanes = scheduleTaskForRootDuringMicrotask(root, currentTime);
        if (nextLanes === fiber_lane_constants_1.NoLane) {
            // This root has no more pending work. Remove it from the schedule. To
            // guard against subtle reentrancy bugs, this microtask is the only place
            // we do this — you can add roots to the schedule whenever, but you can
            // only remove them here.
            // Null this out so we know it's been removed from the schedule.
            root.next = null;
            if (prev === null) {
                // This is the new head of the list
                react_fiber_root_scheduler_shared_1.ReactFiberRootSchedulerShared.firstScheduledRoot = next;
            }
            else {
                // @ts-ignore
                prev.next = next;
            }
            if (next === null) {
                // This is the new tail of the list
                react_fiber_root_scheduler_shared_1.ReactFiberRootSchedulerShared.lastScheduledRoot = prev;
            }
        }
        else {
            // This root still has work. Keep it in the list.
            prev = root;
            if ((0, fiber_lane_constants_1.includesSyncLane)(nextLanes)) {
                react_fiber_work_on_root_shared_1.ReactFiberWorkOnRootShared.setHavePendingSyncWork();
            }
        }
        root = next;
    }
    react_fiber_root_scheduler_shared_1.ReactFiberRootSchedulerShared.currentEventTransitionLane = fiber_lane_constants_1.NoLane;
    // At the end of the microtask, flush any pending synchronous work. This has
    // to come at the end, because it does actual rendering work that might throw.
    react_fiber_work_on_root_shared_1.ReactFiberWorkOnRootShared.flushSyncWorkOnAllRoots();
}
function ensureRootScheduled(root) {
    // This function is called whenever a root receives an update. It does two
    // things 1) it ensures the root is in the root schedule, and 2) it ensures
    // there's a pending microtask to process the root schedule.
    //
    // Most of the actual scheduling logic does not happen until
    // `scheduleTaskForRootDuringMicrotask` runs.
    // Add the root to the schedule
    if (root === react_fiber_root_scheduler_shared_1.ReactFiberRootSchedulerShared.lastScheduledRoot || root.next !== null) { // Fast path. This root is already scheduled.
    }
    else {
        if (react_fiber_root_scheduler_shared_1.ReactFiberRootSchedulerShared.lastScheduledRoot === null) {
            react_fiber_root_scheduler_shared_1.ReactFiberRootSchedulerShared.firstScheduledRoot = react_fiber_root_scheduler_shared_1.ReactFiberRootSchedulerShared.lastScheduledRoot = root;
        }
        else {
            react_fiber_root_scheduler_shared_1.ReactFiberRootSchedulerShared.lastScheduledRoot.next = root;
            react_fiber_root_scheduler_shared_1.ReactFiberRootSchedulerShared.lastScheduledRoot = root;
        }
    }
    // Any time a root received an update, we set this to true until the next time
    // we process the schedule. If it's false, then we can quickly exit flushSync
    // without consulting the schedule.
    react_fiber_work_on_root_shared_1.ReactFiberWorkOnRootShared.setHavePendingSyncWork();
    // At the end of the current event, go through each of the roots and ensure
    // there's a task scheduled for each one at the correct priority.
    if (__DEV__ && ReactCurrentActQueue.current !== null) {
        // We're inside an `act` scope.
        if (!react_fiber_root_scheduler_shared_1.ReactFiberRootSchedulerShared.didScheduleMicrotask_act) {
            react_fiber_root_scheduler_shared_1.ReactFiberRootSchedulerShared.didScheduleMicrotask_act = true;
            scheduleImmediateTask(processRootScheduleInMicrotask);
        }
    }
    else {
        if (!react_fiber_root_scheduler_shared_1.ReactFiberRootSchedulerShared.didScheduleMicrotask) {
            react_fiber_root_scheduler_shared_1.ReactFiberRootSchedulerShared.didScheduleMicrotask = true;
            scheduleImmediateTask(processRootScheduleInMicrotask);
        }
    }
    if (!react_feature_flags_1.enableDeferRootSchedulingToMicrotask) {
        // While this flag is disabled, we schedule the render task immediately
        // instead of waiting a microtask.
        // TODO: We need to land enableDeferRootSchedulingToMicrotask ASAP to
        // unblock additional features we have planned.
        scheduleTaskForRootDuringMicrotask(root, (0, react_scheduler_1.unstable_now)());
    }
    if (__DEV__ && ReactCurrentActQueue.isBatchingLegacy && root.tag === root_tags_1.LegacyRoot) {
        // Special `act` case: Record whenever a legacy update is scheduled.
        ReactCurrentActQueue.didScheduleLegacyUpdate = true;
    }
}
exports.ensureRootScheduled = ensureRootScheduled;
function scheduleImmediateTask(cb) {
    if (__DEV__ && ReactCurrentActQueue.current !== null) {
        // Special case: Inside an `act` scope, we push microtasks to the fake `act`
        // callback queue. This is because we currently support calling `act`
        // without awaiting the result. The plan is to deprecate that, and require
        // that you always await the result so that the microtasks have a chance to
        // run. But it hasn't happened yet.
        ReactCurrentActQueue.current.push(function () {
            cb();
            return null;
        });
    }
    // TODO: Can we land supportsMicrotasks? Which environments don't support it?
    // Alternatively, can we move this check to the host config?
    if (supportsMicrotasks) {
        scheduleMicrotask(function () {
            // In Safari, appending an iframe forces microtasks to run.
            // https://github.com/facebook/react/issues/22459
            // We don't support running callbacks in the middle of render
            // or commit so we need to check against that.
            if ((0, react_fiber_work_excution_context_1.isExecutionContextRenderOrCommitDeactivate)()) {
                // Note that this would still prematurely flush the callbacks
                // if this happens outside render or commit phase (e.g. in an event).
                // Intentionally using a macrotask instead of a microtask here. This is
                // wrong semantically but it prevents an infinite loop. The bug is
                // Safari's, not ours, so we just do our best to not crash even though
                // the behavior isn't completely correct.
                (0, react_scheduler_1.unstable_scheduleCallback)(react_scheduler_1.unstable_ImmediatePriority, cb);
                return;
            }
            cb();
        });
    }
    else {
        // If microtasks are not supported, use Scheduler.
        (0, react_scheduler_1.unstable_scheduleCallback)(react_scheduler_1.unstable_ImmediatePriority, cb);
    }
}
exports.scheduleImmediateTask = scheduleImmediateTask;
function scheduleTaskForRootDuringMicrotask(root, currentTime) {
    // This function is always called inside a microtask, or at the very end of a
    // rendering task right before we yield to the main thread. It should never be
    // called synchronously.
    //
    // TODO: Unless enableDeferRootSchedulingToMicrotask is off. We need to land
    // that ASAP to unblock additional features we have planned.
    //
    // This function also never performs React work synchronously; it should
    // only schedule work to be performed later, in a separate task or microtask.
    // Check if any lanes are being starved by other work. If so, mark them as
    // expired so we know to work on those next.
    (0, react_fiber_lane_1.markStarvedLanesAsExpired)(root, currentTime);
    // Determine the next lanes to work on, and their priority.
    var workInProgressRoot = (0, react_fiber_work_in_progress_1.getWorkInProgressRoot)();
    var workInProgressRootRenderLanes = (0, react_fiber_work_in_progress_1.getWorkInProgressRootRenderLanes)();
    var nextLanes = (0, react_fiber_lane_1.getNextLanes)(root, root === workInProgressRoot ? workInProgressRootRenderLanes : fiber_lane_constants_1.NoLanes);
    var existingCallbackNode = root.callbackNode;
    if ( // Check if there's nothing to work on
    nextLanes === fiber_lane_constants_1.NoLanes || // If this root is currently suspended and waiting for data to resolve, don't
        // schedule a task to render it. We'll either wait for a ping, or wait to
        // receive an update.
        //
        // Suspended render phase
        root === workInProgressRoot && (0, react_fiber_work_in_progress_1.isWorkLoopSuspendedOnData)() || // Suspended commit phase
        root.cancelPendingCommit !== null) {
        // Fast path: There's nothing to work on.
        if (existingCallbackNode !== null) {
            cancelCallback(existingCallbackNode);
        }
        root.callbackNode = null;
        root.callbackPriority = fiber_lane_constants_1.NoLane;
        return fiber_lane_constants_1.NoLane;
    }
    // Schedule a new callback in the host environment.
    if ((0, fiber_lane_constants_1.includesSyncLane)(nextLanes)) {
        // Synchronous work is always flushed at the end of the microtask, so we
        // don't need to schedule an additional task.
        if (existingCallbackNode !== null) {
            cancelCallback(existingCallbackNode);
        }
        root.callbackPriority = fiber_lane_constants_1.SyncLane;
        root.callbackNode = null;
        return fiber_lane_constants_1.SyncLane;
    }
    else {
        // We use the highest priority lane to represent the priority of the callback.
        var existingCallbackPriority = root.callbackPriority;
        var newCallbackPriority = (0, fiber_lane_constants_1.getHighestPriorityLane)(nextLanes);
        if (newCallbackPriority === existingCallbackPriority && // Special case related to `act`. If the currently scheduled task is a
            // Scheduler task, rather than an `act` task, cancel it and re-schedule
            // on the `act` queue.
            !(__DEV__ && ReactCurrentActQueue.current !== null && existingCallbackNode !== fakeActCallbackNode)) {
            // The priority hasn't changed. We can reuse the existing task.
            return newCallbackPriority;
        }
        else {
            // Cancel the existing callback. We'll schedule a new one below.
            cancelCallback(existingCallbackNode);
        }
        var schedulerPriorityLevel = void 0;
        var result = (0, react_event_priorities_1.lanesToEventPriority)(nextLanes);
        switch (result) {
            case react_event_priorities_1.DiscreteEventPriority:
                schedulerPriorityLevel = react_scheduler_1.unstable_ImmediatePriority;
                break;
            case react_event_priorities_1.ContinuousEventPriority:
                schedulerPriorityLevel = react_scheduler_1.unstable_UserBlockingPriority;
                break;
            case react_event_priorities_1.DefaultEventPriority:
                schedulerPriorityLevel = react_scheduler_1.unstable_NormalPriority;
                break;
            case react_event_priorities_1.IdleEventPriority:
                schedulerPriorityLevel = react_scheduler_1.unstable_IdlePriority;
                break;
            default:
                schedulerPriorityLevel = react_scheduler_1.unstable_NormalPriority;
                break;
        }
        var newCallbackNode = scheduleCallback(schedulerPriorityLevel, react_fiber_work_on_root_concurrent_1.performConcurrentWorkOnRoot.bind(null, root));
        root.callbackPriority = newCallbackPriority;
        root.callbackNode = newCallbackNode;
        return newCallbackPriority;
    }
}
exports.scheduleTaskForRootDuringMicrotask = scheduleTaskForRootDuringMicrotask;
function scheduleCallback(priorityLevel, callback) {
    if (__DEV__ && ReactCurrentActQueue.current !== null) {
        // Special case: We're inside an `act` scope (a testing utility).
        // Instead of scheduling work in the host environment, add it to a
        // fake internal queue that's managed by the `act` implementation.
        ReactCurrentActQueue.current.push(callback);
        return fakeActCallbackNode;
    }
    else {
        return (0, react_scheduler_1.unstable_scheduleCallback)(priorityLevel, callback);
    }
}
function cancelCallback(callbackNode) {
    if (__DEV__ && callbackNode === fakeActCallbackNode) { // Special `act` case: check if this is the fake callback node used by
        // the `act` implementation.
    }
    else if (callbackNode !== null) {
        (0, react_scheduler_1.unstable_cancelCallback)(callbackNode);
    }
}
