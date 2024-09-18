"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rerenderDeferredValue = exports.updateDeferredValue = exports.mountDeferredValue = void 0;
var react_feature_flags_1 = require("@zenflux/react-shared/src/react-feature-flags");
var object_is_1 = require("@zenflux/react-shared/src/object-is");
var fiber_lane_constants_1 = require("@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants");
var react_fiber_lane_1 = require("@zenflux/react-reconciler/src/react-fiber-lane");
var react_fiber_hooks_shared_1 = require("@zenflux/react-reconciler/src/react-fiber-hooks-shared");
var react_fiber_work_in_progress_request_lane_1 = require("@zenflux/react-reconciler/src/react-fiber-work-in-progress-request-lane");
var react_fiber_work_in_progress_1 = require("@zenflux/react-reconciler/src/react-fiber-work-in-progress");
var react_fiber_hooks_infra_1 = require("@zenflux/react-reconciler/src/react-fiber-hooks-infra");
var react_fiber_hidden_context_1 = require("@zenflux/react-reconciler/src/react-fiber-hidden-context");
var react_fiber_work_in_progress_receive_update_1 = require("@zenflux/react-reconciler/src/react-fiber-work-in-progress-receive-update");
function mountDeferredValueImpl(hook, value, initialValue) {
    if (react_feature_flags_1.enableUseDeferredValueInitialArg && // When `initialValue` is provided, we defer the initial render even if the
        // current render is not synchronous.
        initialValue !== undefined && // However, to avoid waterfalls, we do not defer if this render
        // was itself spawned by an earlier useDeferredValue. Check if DeferredLane
        // is part of the render lanes.
        !(0, react_fiber_lane_1.includesSomeLane)(react_fiber_hooks_shared_1.ReactFiberHooksCurrent.renderLanes, fiber_lane_constants_1.DeferredLane)) {
        // Render with the initial value
        hook.memoizedState = initialValue;
        // Schedule a deferred render to switch to the final value.
        var deferredLane = (0, react_fiber_work_in_progress_request_lane_1.requestDeferredLane)();
        react_fiber_hooks_shared_1.ReactFiberHooksCurrent.renderingFiber.lanes = (0, react_fiber_lane_1.mergeLanes)(react_fiber_hooks_shared_1.ReactFiberHooksCurrent.renderingFiber.lanes, deferredLane);
        (0, react_fiber_work_in_progress_1.markSkippedUpdateLanes)(deferredLane);
        return initialValue;
    }
    else {
        hook.memoizedState = value;
        return value;
    }
}
function mountDeferredValue(value, initialValue) {
    var hook = (0, react_fiber_hooks_infra_1.mountWorkInProgressHook)();
    return mountDeferredValueImpl(hook, value, initialValue);
}
exports.mountDeferredValue = mountDeferredValue;
function updateDeferredValue(value, initialValue) {
    var hook = (0, react_fiber_hooks_infra_1.updateWorkInProgressHook)();
    var resolvedCurrentHook = react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hook;
    var prevValue = resolvedCurrentHook.memoizedState;
    return updateDeferredValueImpl(hook, prevValue, value, initialValue);
}
exports.updateDeferredValue = updateDeferredValue;
function updateDeferredValueImpl(hook, prevValue, value, initialValue) {
    if ((0, object_is_1.default)(value, prevValue)) {
        // The incoming value is referentially identical to the currently rendered
        // value, so we can bail out quickly.
        return value;
    }
    else {
        // Received a new value that's different from the current value.
        // Check if we're inside a hidden tree
        if ((0, react_fiber_hidden_context_1.isCurrentTreeHidden)()) {
            // Revealing a prerendered tree is considered the same as mounting new
            // one, so we reuse the "mount" path in this case.
            var resultValue = mountDeferredValueImpl(hook, value, initialValue);
            // Unlike during an actual mount, we need to mark this as an update if
            // the value changed.
            if (!(0, object_is_1.default)(resultValue, prevValue)) {
                (0, react_fiber_work_in_progress_receive_update_1.markWorkInProgressReceivedUpdate)();
            }
            return resultValue;
        }
        var shouldDeferValue = !(0, fiber_lane_constants_1.includesOnlyNonUrgentLanes)(react_fiber_hooks_shared_1.ReactFiberHooksCurrent.renderLanes);
        if (shouldDeferValue) {
            // This is an urgent update. Since the value has changed, keep using the
            // previous value and spawn a deferred render to update it later.
            // Schedule a deferred render
            var deferredLane = (0, react_fiber_work_in_progress_request_lane_1.requestDeferredLane)();
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.renderingFiber.lanes = (0, react_fiber_lane_1.mergeLanes)(react_fiber_hooks_shared_1.ReactFiberHooksCurrent.renderingFiber.lanes, deferredLane);
            (0, react_fiber_work_in_progress_1.markSkippedUpdateLanes)(deferredLane);
            // Reuse the previous value. We do not need to mark this as an update,
            // because we did not render a new value.
            return prevValue;
        }
        else {
            // This is not an urgent update, so we can use the latest value regardless
            // of what it is. No need to defer it.
            // Mark this as an update to prevent the fiber from bailing out.
            (0, react_fiber_work_in_progress_receive_update_1.markWorkInProgressReceivedUpdate)();
            hook.memoizedState = value;
            return value;
        }
    }
}
function rerenderDeferredValue(value, initialValue) {
    var hook = (0, react_fiber_hooks_infra_1.updateWorkInProgressHook)();
    if (react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hook === null) {
        // This is a rerender during a mount.
        return mountDeferredValueImpl(hook, value, initialValue);
    }
    else {
        // This is a rerender during an update.
        var prevValue = react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hook.memoizedState;
        return updateDeferredValueImpl(hook, prevValue, value, initialValue);
    }
}
exports.rerenderDeferredValue = rerenderDeferredValue;
