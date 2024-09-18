"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setPendingPassiveTransitions = exports.setPendingPassiveEffectsRemainingLanes = exports.setPendingPassiveEffectsLanes = exports.getPendingPassiveEffectsLanes = exports.setCurrentEndTime = exports.clearRootWithPendingPassiveEffects = exports.setRootWithPendingPassiveEffects = exports.getRootWithPendingPassiveEffectsSafe = exports.getRootWithPendingPassiveEffects = exports.hasRootWithPendingPassiveEffects = exports.isFlushPassiveEffects = exports.clearRootHavePassiveEffects = exports.setRootHavePassiveEffects = exports.hasRootWithPassiveEffects = exports.setDidScheduleUpdateDuringPassiveEffects = exports.enqueuePendingPassiveProfilerEffect = exports.flushPassiveEffects = void 0;
var react_feature_flags_1 = require("@zenflux/react-shared/src/react-feature-flags");
var react_scheduler_1 = require("@zenflux/react-scheduler");
var react_shared_internals_1 = require("@zenflux/react-shared/src/react-shared-internals");
var fiber_lane_constants_1 = require("@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants");
var react_fiber_work_on_root_shared_1 = require("@zenflux/react-reconciler/src/react-fiber-work-on-root-shared");
var react_fiber_work_double_invoke_shared_dev_1 = require("@zenflux/react-reconciler/src/react-fiber-work-double-invoke-shared-dev");
var react_fiber_work_excution_context_1 = require("@zenflux/react-reconciler/src/react-fiber-work-excution-context");
var react_debug_tracing_1 = require("@zenflux/react-reconciler/src/react-debug-tracing");
var react_fiber_dev_tools_hook_1 = require("@zenflux/react-reconciler/src/react-fiber-dev-tools-hook");
var react_fiber_tracing_marker_component_1 = require("@zenflux/react-reconciler/src/react-fiber-tracing-marker-component");
var react_fiber_work_nested_count_1 = require("@zenflux/react-reconciler/src/react-fiber-work-nested-count");
var react_event_priorities_1 = require("@zenflux/react-reconciler/src/react-event-priorities");
var react_fiber_work_schedule_callback_1 = require("@zenflux/react-reconciler/src/react-fiber-work-schedule-callback");
var react_fiber_work_current_transaction_1 = require("@zenflux/react-reconciler/src/react-fiber-work-current-transaction");
var react_release_root_pooled_cache_1 = require("@zenflux/react-reconciler/src/react-release-root-pooled-cache");
var react_fiber_work_commit_passive_1 = require("@zenflux/react-reconciler/src/react-fiber-work-commit-passive");
var ReactCurrentBatchConfig = react_shared_internals_1.default.ReactCurrentBatchConfig;
var rootDoesHavePassiveEffects = false;
var rootWithPendingPassiveEffects = null;
var pendingPassiveEffectsLanes = fiber_lane_constants_1.NoLanes;
var pendingPassiveProfilerEffects = [];
var pendingPassiveEffectsRemainingLanes = fiber_lane_constants_1.NoLanes;
var pendingPassiveTransitions = null;
var isFlushingPassiveEffects = false;
var didScheduleUpdateDuringPassiveEffects = false;
var currentEndTime = null;
function flushPassiveEffectsImpl() {
    if (rootWithPendingPassiveEffects === null) {
        return false;
    }
    // Cache and clear the transitions flag
    var transitions = pendingPassiveTransitions;
    pendingPassiveTransitions = null;
    var root = rootWithPendingPassiveEffects;
    var lanes = pendingPassiveEffectsLanes;
    clearRootWithPendingPassiveEffects();
    // TODO: This is sometimes out of sync with rootWithPendingPassiveEffects.
    // Figure out why and fix it. It's not causing any known issues (probably
    // because it's only used for profiling), but it's a refactor hazard.
    pendingPassiveEffectsLanes = fiber_lane_constants_1.NoLanes;
    if ((0, react_fiber_work_excution_context_1.isExecutionContextRenderOrCommitDeactivate)()) {
        throw new Error("Cannot flush passive effects while already rendering.");
    }
    if (__DEV__) {
        isFlushingPassiveEffects = true;
        didScheduleUpdateDuringPassiveEffects = false;
        if (react_feature_flags_1.enableDebugTracing) {
            (0, react_debug_tracing_1.logPassiveEffectsStarted)(lanes);
        }
    }
    if (react_feature_flags_1.enableSchedulingProfiler) {
        (0, react_fiber_dev_tools_hook_1.markPassiveEffectsStarted)(lanes);
    }
    var prevExecutionContext = (0, react_fiber_work_excution_context_1.getExecutionContext)();
    (0, react_fiber_work_excution_context_1.activateExecutionCommitContext)();
    (0, react_fiber_work_commit_passive_1.commitPassiveUnmountEffects)(root.current);
    (0, react_fiber_work_commit_passive_1.commitPassiveMountEffects)(root, root.current, lanes, transitions);
    // TODO: Move to commitPassiveMountEffects
    if (react_feature_flags_1.enableProfilerTimer && react_feature_flags_1.enableProfilerCommitHooks) {
        var profilerEffects = pendingPassiveProfilerEffects;
        pendingPassiveProfilerEffects = [];
        for (var i = 0; i < profilerEffects.length; i++) {
            var fiber = profilerEffects[i];
            (0, react_fiber_work_commit_passive_1.commitPassiveEffectDurations)(root, fiber);
        }
    }
    if (__DEV__) {
        if (react_feature_flags_1.enableDebugTracing) {
            (0, react_debug_tracing_1.logPassiveEffectsStopped)();
        }
    }
    if (react_feature_flags_1.enableSchedulingProfiler) {
        (0, react_fiber_dev_tools_hook_1.markPassiveEffectsStopped)();
    }
    if (__DEV__) {
        react_fiber_work_double_invoke_shared_dev_1.ReactFiberWorkDoubleInvokeSharedDev.commitDoubleInvokeEffectsInDEV(root, true);
    }
    (0, react_fiber_work_excution_context_1.setExecutionContext)(prevExecutionContext);
    react_fiber_work_on_root_shared_1.ReactFiberWorkOnRootShared.flushSyncWorkOnAllRoots();
    if (react_feature_flags_1.enableTransitionTracing) {
        var prevPendingTransitionCallbacks_1 = (0, react_fiber_work_current_transaction_1.getCurrentPendingTransitionCallbacks)();
        var prevRootTransitionCallbacks_1 = root.transitionCallbacks;
        var prevEndTime_1 = currentEndTime;
        if (prevPendingTransitionCallbacks_1 !== null && prevRootTransitionCallbacks_1 !== null && prevEndTime_1 !== null) {
            (0, react_fiber_work_current_transaction_1.setCurrentPendingTransitionCallbacks)(null);
            currentEndTime = null;
            (0, react_fiber_work_schedule_callback_1.fiberWorkScheduleCallback)(react_scheduler_1.unstable_IdlePriority, function () {
                (0, react_fiber_tracing_marker_component_1.processTransitionCallbacks)(prevPendingTransitionCallbacks_1, prevEndTime_1, prevRootTransitionCallbacks_1);
            });
        }
    }
    if (__DEV__) {
        // If additional passive effects were scheduled, increment a counter. If this
        // exceeds the limit, we'll fire a warning.
        if (didScheduleUpdateDuringPassiveEffects) {
            // if ( root === rootWithPassiveNestedUpdates ) {
            if ((0, react_fiber_work_nested_count_1.isNestedRootWithPassiveUpdate)(root)) {
                // nestedPassiveUpdateCount++;
                (0, react_fiber_work_nested_count_1.incrementNestedPassiveUpdateCount)();
            }
            else {
                // nestedPassiveUpdateCount = 0;
                (0, react_fiber_work_nested_count_1.resetNestedPassiveUpdateCount)();
                // rootWithPassiveNestedUpdates = root;
                (0, react_fiber_work_nested_count_1.setNestedRootWithPassiveUpdate)(root);
            }
        }
        else {
            // nestedPassiveUpdateCount = 0;
            (0, react_fiber_work_nested_count_1.resetNestedPassiveUpdateCount)();
        }
        isFlushingPassiveEffects = false;
        didScheduleUpdateDuringPassiveEffects = false;
    }
    // TODO: Move to commitPassiveMountEffects
    (0, react_fiber_dev_tools_hook_1.onPostCommitRoot)(root);
    if (react_feature_flags_1.enableProfilerTimer && react_feature_flags_1.enableProfilerCommitHooks) {
        var stateNode = root.current.stateNode;
        stateNode.effectDuration = 0;
        stateNode.passiveEffectDuration = 0;
    }
    return true;
}
function flushPassiveEffects() {
    // Returns whether passive effects were flushed.
    // TODO: Combine this check with the one in flushPassiveEffectsImpl. We should
    // probably just combine the two functions. I believe they were only separate
    // in the first place because we used to wrap it with
    // `Scheduler.runWithPriority`, which accepts a function. But now we track the
    // priority within React itself, so we can mutate the variable directly.
    if (rootWithPendingPassiveEffects !== null) {
        // Cache the root since rootWithPendingPassiveEffects is cleared in
        // flushPassiveEffectsImpl
        var root = rootWithPendingPassiveEffects;
        // Cache and clear the remaining lanes flag; it must be reset since this
        // method can be called from various places, not always from commitRoot
        // where the remaining lanes are known
        var remainingLanes = pendingPassiveEffectsRemainingLanes;
        pendingPassiveEffectsRemainingLanes = fiber_lane_constants_1.NoLanes;
        var renderPriority = (0, react_event_priorities_1.lanesToEventPriority)(pendingPassiveEffectsLanes);
        var priority = (0, react_event_priorities_1.lowerEventPriority)(react_event_priorities_1.DefaultEventPriority, renderPriority);
        var prevTransition = ReactCurrentBatchConfig.transition;
        var previousPriority = (0, react_event_priorities_1.getCurrentUpdatePriority)();
        try {
            ReactCurrentBatchConfig.transition = null;
            (0, react_event_priorities_1.setCurrentUpdatePriority)(priority);
            return flushPassiveEffectsImpl();
        }
        finally {
            (0, react_event_priorities_1.setCurrentUpdatePriority)(previousPriority);
            ReactCurrentBatchConfig.transition = prevTransition;
            // Once passive effects have run for the tree - giving components a
            // chance to retain cache instances they use - release the pooled
            // cache at the root (if there is one)
            (0, react_release_root_pooled_cache_1.reactReleaseRootPooledCache)(root, remainingLanes);
        }
    }
    return false;
}
exports.flushPassiveEffects = flushPassiveEffects;
function enqueuePendingPassiveProfilerEffect(fiber) {
    if (react_feature_flags_1.enableProfilerTimer && react_feature_flags_1.enableProfilerCommitHooks) {
        pendingPassiveProfilerEffects.push(fiber);
        if (!rootDoesHavePassiveEffects) {
            setRootHavePassiveEffects();
            (0, react_fiber_work_schedule_callback_1.fiberWorkScheduleCallback)(react_scheduler_1.unstable_NormalPriority, function () {
                flushPassiveEffects();
                return null;
            });
        }
    }
}
exports.enqueuePendingPassiveProfilerEffect = enqueuePendingPassiveProfilerEffect;
function setDidScheduleUpdateDuringPassiveEffects() {
    didScheduleUpdateDuringPassiveEffects = true;
}
exports.setDidScheduleUpdateDuringPassiveEffects = setDidScheduleUpdateDuringPassiveEffects;
function hasRootWithPassiveEffects() {
    return rootDoesHavePassiveEffects;
}
exports.hasRootWithPassiveEffects = hasRootWithPassiveEffects;
function setRootHavePassiveEffects() {
    rootDoesHavePassiveEffects = true;
}
exports.setRootHavePassiveEffects = setRootHavePassiveEffects;
function clearRootHavePassiveEffects() {
    rootDoesHavePassiveEffects = false;
}
exports.clearRootHavePassiveEffects = clearRootHavePassiveEffects;
function isFlushPassiveEffects() {
    return isFlushingPassiveEffects;
}
exports.isFlushPassiveEffects = isFlushPassiveEffects;
function hasRootWithPendingPassiveEffects() {
    return rootWithPendingPassiveEffects !== null;
}
exports.hasRootWithPendingPassiveEffects = hasRootWithPendingPassiveEffects;
function getRootWithPendingPassiveEffects() {
    return rootWithPendingPassiveEffects;
}
exports.getRootWithPendingPassiveEffects = getRootWithPendingPassiveEffects;
function getRootWithPendingPassiveEffectsSafe() {
    return rootWithPendingPassiveEffects;
}
exports.getRootWithPendingPassiveEffectsSafe = getRootWithPendingPassiveEffectsSafe;
function setRootWithPendingPassiveEffects(root) {
    rootWithPendingPassiveEffects = root;
}
exports.setRootWithPendingPassiveEffects = setRootWithPendingPassiveEffects;
function clearRootWithPendingPassiveEffects() {
    rootWithPendingPassiveEffects = null;
}
exports.clearRootWithPendingPassiveEffects = clearRootWithPendingPassiveEffects;
function setCurrentEndTime(endTime) {
    currentEndTime = endTime;
}
exports.setCurrentEndTime = setCurrentEndTime;
function getPendingPassiveEffectsLanes() {
    return pendingPassiveEffectsLanes;
}
exports.getPendingPassiveEffectsLanes = getPendingPassiveEffectsLanes;
function setPendingPassiveEffectsLanes(lanes) {
    pendingPassiveEffectsLanes = lanes;
}
exports.setPendingPassiveEffectsLanes = setPendingPassiveEffectsLanes;
function setPendingPassiveEffectsRemainingLanes(lanes) {
    pendingPassiveEffectsRemainingLanes = lanes;
}
exports.setPendingPassiveEffectsRemainingLanes = setPendingPassiveEffectsRemainingLanes;
function setPendingPassiveTransitions(transitions) {
    pendingPassiveTransitions = transitions;
}
exports.setPendingPassiveTransitions = setPendingPassiveTransitions;
