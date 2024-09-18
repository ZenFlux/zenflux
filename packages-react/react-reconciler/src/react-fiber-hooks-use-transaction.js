"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rerenderTransition = exports.updateTransition = exports.mountTransition = exports.startTransition = void 0;
var react_scheduler_1 = require("@zenflux/react-scheduler");
var react_feature_flags_1 = require("@zenflux/react-shared/src/react-feature-flags");
var react_shared_internals_1 = require("@zenflux/react-shared/src/react-shared-internals");
var react_event_priorities_1 = require("@zenflux/react-reconciler/src/react-event-priorities");
var react_fiber_async_action_1 = require("@zenflux/react-reconciler/src/react-fiber-async-action");
var react_fiber_hooks_infra_1 = require("@zenflux/react-reconciler/src/react-fiber-hooks-infra");
var react_fiber_hooks_shared_1 = require("@zenflux/react-reconciler/src/react-fiber-hooks-shared");
var react_fiber_hooks_use_1 = require("@zenflux/react-reconciler/src/react-fiber-hooks-use");
var react_fiber_hooks_use_optimistic_1 = require("@zenflux/react-reconciler/src/react-fiber-hooks-use-optimistic");
var react_fiber_hooks_use_state_1 = require("@zenflux/react-reconciler/src/react-fiber-hooks-use-state");
var ReactCurrentBatchConfig = react_shared_internals_1.default.ReactCurrentBatchConfig;
function startTransition(fiber, queue, pendingState, finishedState, callback, options) {
    var previousPriority = (0, react_event_priorities_1.getCurrentUpdatePriority)();
    (0, react_event_priorities_1.setCurrentUpdatePriority)((0, react_event_priorities_1.higherEventPriority)(previousPriority, react_event_priorities_1.ContinuousEventPriority));
    var prevTransition = ReactCurrentBatchConfig.transition;
    var currentTransition = {};
    if (react_feature_flags_1.enableAsyncActions) {
        // We don't really need to use an optimistic update here, because we
        // schedule a second "revert" update below (which we use to suspend the
        // transition until the async action scope has finished). But we'll use an
        // optimistic update anyway to make it less likely the behavior accidentally
        // diverges; for example, both an optimistic update and this one should
        // share the same lane.
        ReactCurrentBatchConfig.transition = currentTransition;
        (0, react_fiber_hooks_use_optimistic_1.dispatchOptimisticSetState)(fiber, false, queue, pendingState);
    }
    else {
        ReactCurrentBatchConfig.transition = null;
        (0, react_fiber_hooks_use_state_1.dispatchSetState)(fiber, queue, pendingState);
        ReactCurrentBatchConfig.transition = currentTransition;
    }
    if (react_feature_flags_1.enableTransitionTracing) {
        if (options !== undefined && options.name !== undefined) {
            ReactCurrentBatchConfig.transition.name = options.name;
            ReactCurrentBatchConfig.transition.startTime = (0, react_scheduler_1.unstable_now)();
        }
    }
    if (__DEV__) {
        ReactCurrentBatchConfig.transition._updatedFibers = new Set();
    }
    try {
        if (react_feature_flags_1.enableAsyncActions) {
            var returnValue = callback();
            // Check if we're inside an async action scope. If so, we'll entangle
            // this new action with the existing scope.
            //
            // If we're not already inside an async action scope, and this action is
            // async, then we'll create a new async scope.
            //
            // In the async case, the resulting render will suspend until the async
            // action scope has finished.
            if (returnValue !== null && typeof returnValue === "object" && typeof returnValue.then === "function") {
                var thenable = returnValue;
                // This is a thenable that resolves to `finishedState` once the async
                // action scope has finished.
                var entangledResult = (0, react_fiber_async_action_1.requestAsyncActionContext)(thenable, finishedState);
                (0, react_fiber_hooks_use_state_1.dispatchSetState)(fiber, queue, entangledResult);
            }
            else {
                // This is either `finishedState` or a thenable that resolves to
                // `finishedState`, depending on whether we're inside an async
                // action scope.
                var entangledResult = (0, react_fiber_async_action_1.requestSyncActionContext)(returnValue, finishedState);
                (0, react_fiber_hooks_use_state_1.dispatchSetState)(fiber, queue, entangledResult);
            }
        }
        else {
            // Async actions are not enabled.
            (0, react_fiber_hooks_use_state_1.dispatchSetState)(fiber, queue, finishedState);
            callback();
        }
    }
    catch (error) {
        if (react_feature_flags_1.enableAsyncActions) {
            // This is a trick to get the `useTransition` hook to rethrow the error.
            // When it unwraps the thenable with the `use` algorithm, the error
            // will be thrown.
            var rejectedThenable = {
                then: function () {
                },
                status: "rejected",
                reason: error
            };
            (0, react_fiber_hooks_use_state_1.dispatchSetState)(fiber, queue, rejectedThenable);
        }
        else {
            // The error rethrowing behavior is only enabled when the async actions
            // feature is on, even for sync actions.
            throw error;
        }
    }
    finally {
        (0, react_event_priorities_1.setCurrentUpdatePriority)(previousPriority);
        ReactCurrentBatchConfig.transition = prevTransition;
        if (__DEV__) {
            if (prevTransition === null && currentTransition._updatedFibers) {
                var updatedFibersCount = currentTransition._updatedFibers.size;
                currentTransition._updatedFibers.clear();
                if (updatedFibersCount > 10) {
                    console.warn("Detected a large number of updates inside startTransition. " + "If this is due to a subscription please re-write it to use React provided hooks. " + "Otherwise concurrent mode guarantees are off the table.");
                }
            }
        }
    }
}
exports.startTransition = startTransition;
function mountTransition() {
    var stateHook = (0, react_fiber_hooks_use_state_1.mountStateImpl)(false);
    // The `start` method never changes.
    var start = startTransition.bind(null, react_fiber_hooks_shared_1.ReactFiberHooksCurrent.renderingFiber, stateHook.queue, true, false);
    var hook = (0, react_fiber_hooks_infra_1.mountWorkInProgressHook)();
    hook.memoizedState = start;
    return [false, start];
}
exports.mountTransition = mountTransition;
function updateTransition() {
    var booleanOrThenable = (0, react_fiber_hooks_use_state_1.updateState)(false)[0];
    var hook = (0, react_fiber_hooks_infra_1.updateWorkInProgressHook)();
    var start = hook.memoizedState;
    var isPending = typeof booleanOrThenable === "boolean" ? booleanOrThenable : // This will suspend until the async action scope has finished.
        (0, react_fiber_hooks_use_1.useThenable)(booleanOrThenable);
    return [isPending, start];
}
exports.updateTransition = updateTransition;
function rerenderTransition() {
    var booleanOrThenable = (0, react_fiber_hooks_use_state_1.rerenderState)(false)[0];
    var hook = (0, react_fiber_hooks_infra_1.updateWorkInProgressHook)();
    var start = hook.memoizedState;
    var isPending = typeof booleanOrThenable === "boolean" ? booleanOrThenable : // This will suspend until the async action scope has finished.
        (0, react_fiber_hooks_use_1.useThenable)(booleanOrThenable);
    return [isPending, start];
}
exports.rerenderTransition = rerenderTransition;
