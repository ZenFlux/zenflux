"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rerenderOptimistic = exports.updateOptimistic = exports.mountOptimistic = exports.dispatchOptimisticSetState = void 0;
var react_shared_internals_1 = require("@zenflux/react-shared/src/react-shared-internals");
var fiber_lane_constants_1 = require("@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants");
var react_fiber_async_action_1 = require("@zenflux/react-reconciler/src/react-fiber-async-action");
var react_fiber_concurrent_updates_1 = require("@zenflux/react-reconciler/src/react-fiber-concurrent-updates");
var react_fiber_hooks_infra_1 = require("@zenflux/react-reconciler/src/react-fiber-hooks-infra");
var react_fiber_hooks_shared_1 = require("@zenflux/react-reconciler/src/react-fiber-hooks-shared");
var react_fiber_hooks_use_reducer_1 = require("@zenflux/react-reconciler/src/react-fiber-hooks-use-reducer");
var react_fiber_hooks_use_state_1 = require("@zenflux/react-reconciler/src/react-fiber-hooks-use-state");
var react_fiber_root_scheduler_1 = require("@zenflux/react-reconciler/src/react-fiber-root-scheduler");
var react_fiber_work_schedule_update_1 = require("@zenflux/react-reconciler/src/react-fiber-work-schedule-update");
var ReactCurrentBatchConfig = react_shared_internals_1.default.ReactCurrentBatchConfig;
function dispatchOptimisticSetState(fiber, throwIfDuringRender, queue, action) {
    if (__DEV__) {
        if (ReactCurrentBatchConfig.transition === null) {
            // An optimistic update occurred, but startTransition is not on the stack.
            // There are two likely scenarios.
            // One possibility is that the optimistic update is triggered by a regular
            // event handler (e.g. `onSubmit`) instead of an action. This is a mistake
            // and we will warn.
            // The other possibility is the optimistic update is inside an async
            // action, but after an `await`. In this case, we can make it "just work"
            // by associating the optimistic update with the pending async action.
            // Technically it's possible that the optimistic update is unrelated to
            // the pending action, but we don't have a way of knowing this for sure
            // because browsers currently do not provide a way to track async scope.
            // (The AsyncContext proposal, if it lands, will solve this in the
            // future.) However, this is no different than the problem of unrelated
            // transitions being grouped together — it's not wrong per se, but it's
            // not ideal.
            // Once AsyncContext starts landing in browsers, we will provide better
            // warnings in development for these cases.
            if ((0, react_fiber_async_action_1.peekEntangledActionLane)() !== fiber_lane_constants_1.NoLane) { // There is a pending async action. Don't warn.
            }
            else {
                // There's no pending async action. The most likely cause is that we're
                // inside a regular event handler (e.g. onSubmit) instead of an action.
                console.error("An optimistic state update occurred outside a transition or " + "action. To fix, move the update to an action, or wrap " + "with startTransition.");
            }
        }
    }
    var update = {
        // An optimistic update commits synchronously.
        lane: fiber_lane_constants_1.SyncLane,
        // After committing, the optimistic update is "reverted" using the same
        // lane as the transition it's associated with.
        revertLane: (0, react_fiber_root_scheduler_1.requestTransitionLane)(),
        action: action,
        hasEagerState: false,
        eagerState: null,
        next: null
    };
    if ((0, react_fiber_hooks_infra_1.isRenderPhaseUpdate)(fiber)) {
        // When calling startTransition during render, this warns instead of
        // throwing because throwing would be a breaking change. setOptimisticState
        // is a new API so it's OK to throw.
        if (throwIfDuringRender) {
            throw new Error("Cannot update optimistic state while rendering.");
        }
        else {
            // startTransition was called during render. We don't need to do anything
            // besides warn here because the render phase update would be overidden by
            // the second update, anyway. We can remove this branch and make it throw
            // in a future release.
            if (__DEV__) {
                console.error("Cannot call startTransition while rendering.");
            }
        }
    }
    else {
        var root = (0, react_fiber_concurrent_updates_1.enqueueConcurrentHookUpdate)(fiber, queue, update, fiber_lane_constants_1.SyncLane);
        if (root !== null) {
            // NOTE: The optimistic update implementation assumes that the transition
            // will never be attempted before the optimistic update. This currently
            // holds because the optimistic update is always synchronous. If we ever
            // change that, we'll need to account for this.
            (0, react_fiber_work_schedule_update_1.scheduleUpdateOnFiber)(root, fiber, fiber_lane_constants_1.SyncLane); // Optimistic updates are always synchronous, so we don't need to call
            // entangleTransitionUpdate here.
        }
    }
    (0, react_fiber_hooks_infra_1.markUpdateInDevTools)(fiber, fiber_lane_constants_1.SyncLane, action);
}
exports.dispatchOptimisticSetState = dispatchOptimisticSetState;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function mountOptimistic(passthrough, reducer) {
    var hook = (0, react_fiber_hooks_infra_1.mountWorkInProgressHook)();
    hook.memoizedState = hook.baseState = passthrough;
    var queue = {
        pending: null,
        lanes: fiber_lane_constants_1.NoLanes,
        dispatch: null,
        // Optimistic state does not use the eager update optimization.
        lastRenderedReducer: null,
        lastRenderedState: null
    };
    hook.queue = queue;
    // This is different then the normal setState function.
    var dispatch = dispatchOptimisticSetState.bind(null, react_fiber_hooks_shared_1.ReactFiberHooksCurrent.renderingFiber, true, 
    // @ts-ignore
    queue);
    queue.dispatch = dispatch;
    return [passthrough, dispatch];
}
exports.mountOptimistic = mountOptimistic;
function updateOptimistic(passthrough, reducer) {
    var hook = (0, react_fiber_hooks_infra_1.updateWorkInProgressHook)();
    return updateOptimisticImpl(hook, react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hook, passthrough, reducer);
}
exports.updateOptimistic = updateOptimistic;
function updateOptimisticImpl(hook, current, passthrough, reducer) {
    // Optimistic updates are always rebased on top of the latest value passed in
    // as an argument. It's called a passthrough because if there are no pending
    // updates, it will be returned as-is.
    //
    // Reset the base state to the passthrough. Future updates will be applied
    // on top of this.
    hook.baseState = passthrough;
    // If a reducer is not provided, default to the same one used by useState.
    var resolvedReducer = typeof reducer === "function" ? reducer : react_fiber_hooks_use_state_1.basicStateReducer;
    return (0, react_fiber_hooks_use_reducer_1.updateReducerImpl)(hook, react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hook, resolvedReducer);
}
function rerenderOptimistic(passthrough, reducer) {
    // Unlike useState, useOptimistic doesn't support render phase updates.
    // Also unlike useState, we need to replay all pending updates again in case
    // the passthrough value changed.
    //
    // So instead of a forked re-render implementation that knows how to handle
    // render phase udpates, we can use the same implementation as during a
    // regular mount or update.
    var hook = (0, react_fiber_hooks_infra_1.updateWorkInProgressHook)();
    if (react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hook !== null) {
        // This is an update. Process the update queue.
        return updateOptimisticImpl(hook, react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hook, passthrough, reducer);
    }
    // This is a mount. No updates to process.
    // Reset the base state to the passthrough. Future updates will be applied
    // on top of this.
    hook.baseState = passthrough;
    var dispatch = hook.queue.dispatch;
    return [passthrough, dispatch];
}
exports.rerenderOptimistic = rerenderOptimistic;
