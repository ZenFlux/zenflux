"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateReducerImpl = exports.updateReducer = exports.mountReducer = exports.rerenderReducer = void 0;
var object_is_1 = require("@zenflux/react-shared/src/object-is");
var react_feature_flags_1 = require("@zenflux/react-shared/src/react-feature-flags");
var fiber_lane_constants_1 = require("@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants");
var react_entangled_transaction_1 = require("@zenflux/react-reconciler/src/react-entangled-transaction");
var react_fiber_concurrent_updates_1 = require("@zenflux/react-reconciler/src/react-fiber-concurrent-updates");
var react_fiber_hooks_infra_1 = require("@zenflux/react-reconciler/src/react-fiber-hooks-infra");
var react_fiber_hooks_shared_1 = require("@zenflux/react-reconciler/src/react-fiber-hooks-shared");
var react_fiber_lane_1 = require("@zenflux/react-reconciler/src/react-fiber-lane");
var react_fiber_work_in_progress_1 = require("@zenflux/react-reconciler/src/react-fiber-work-in-progress");
var react_fiber_work_in_progress_receive_update_1 = require("@zenflux/react-reconciler/src/react-fiber-work-in-progress-receive-update");
var react_fiber_work_in_progress_request_lane_1 = require("@zenflux/react-reconciler/src/react-fiber-work-in-progress-request-lane");
var react_fiber_work_schedule_update_1 = require("@zenflux/react-reconciler/src/react-fiber-work-schedule-update");
function dispatchReducerAction(fiber, queue, action) {
    if (__DEV__) {
        if (typeof arguments[3] === "function") {
            console.error("State updates from the useState() and useReducer() Hooks don't support the " + "second callback argument. To execute a side effect after " + "rendering, declare it in the component body with useEffect().");
        }
    }
    var lane = (0, react_fiber_work_in_progress_request_lane_1.requestUpdateLane)(fiber);
    var update = {
        lane: lane,
        revertLane: fiber_lane_constants_1.NoLane,
        action: action,
        hasEagerState: false,
        eagerState: null,
        next: null
    };
    if ((0, react_fiber_hooks_infra_1.isRenderPhaseUpdate)(fiber)) {
        (0, react_fiber_hooks_infra_1.enqueueRenderPhaseUpdate)(queue, update);
    }
    else {
        var root = (0, react_fiber_concurrent_updates_1.enqueueConcurrentHookUpdate)(fiber, queue, update, lane);
        if (root !== null) {
            (0, react_fiber_work_schedule_update_1.scheduleUpdateOnFiber)(root, fiber, lane);
            (0, react_entangled_transaction_1.entangleTransitionUpdate)(root, queue, lane);
        }
    }
    (0, react_fiber_hooks_infra_1.markUpdateInDevTools)(fiber, lane, action);
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function rerenderReducer(reducer, initialArg, init) {
    var hook = (0, react_fiber_hooks_infra_1.updateWorkInProgressHook)();
    var queue = hook.queue;
    if (queue === null) {
        throw new Error("Should have a queue. This is likely a bug in React. Please file an issue.");
    }
    queue.lastRenderedReducer = reducer;
    // This is a re-render. Apply the new render phase updates to the previous
    // work-in-progress hook.
    var dispatch = queue.dispatch;
    var lastRenderPhaseUpdate = queue.pending;
    var newState = hook.memoizedState;
    if (lastRenderPhaseUpdate !== null) {
        // The queue doesn't persist past this render pass.
        queue.pending = null;
        var firstRenderPhaseUpdate = lastRenderPhaseUpdate.next;
        var update = firstRenderPhaseUpdate;
        do {
            // Process this render phase update. We don't have to check the
            // priority because it will always be the same as the current
            // render's.
            var action = update.action;
            newState = reducer(newState, action);
            update = update.next;
        } while (update !== firstRenderPhaseUpdate);
        // Mark that the fiber performed work, but only if the new state is
        // different from the current state.
        if (!(0, object_is_1.default)(newState, hook.memoizedState)) {
            (0, react_fiber_work_in_progress_receive_update_1.markWorkInProgressReceivedUpdate)();
        }
        hook.memoizedState = newState;
        // Don't persist the state accumulated from the render phase updates to
        // the base state unless the queue is empty.
        // TODO: Not sure if this is the desired semantics, but it's what we
        // do for gDSFP. I can't remember why.
        if (hook.baseQueue === null) {
            hook.baseState = newState;
        }
        queue.lastRenderedState = newState;
    }
    return [newState, dispatch];
}
exports.rerenderReducer = rerenderReducer;
function mountReducer(reducer, initialArg, init) {
    var hook = (0, react_fiber_hooks_infra_1.mountWorkInProgressHook)();
    var initialState;
    if (init !== undefined) {
        initialState = init(initialArg);
    }
    else {
        initialState = initialArg;
    }
    hook.memoizedState = hook.baseState = initialState;
    var queue = {
        pending: null,
        lanes: fiber_lane_constants_1.NoLanes,
        dispatch: null,
        lastRenderedReducer: reducer,
        lastRenderedState: initialState
    };
    hook.queue = queue;
    var dispatch = queue.dispatch = dispatchReducerAction.bind(null, react_fiber_hooks_shared_1.ReactFiberHooksCurrent.renderingFiber, 
    // @ts-ignore
    queue);
    return [hook.memoizedState, dispatch];
}
exports.mountReducer = mountReducer;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function updateReducer(reducer, initialArg, init) {
    var hook = (0, react_fiber_hooks_infra_1.updateWorkInProgressHook)();
    return updateReducerImpl(hook, react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hook, reducer);
}
exports.updateReducer = updateReducer;
function updateReducerImpl(hook, current, reducer) {
    var queue = hook.queue;
    if (queue === null) {
        throw new Error("Should have a queue. This is likely a bug in React. Please file an issue.");
    }
    queue.lastRenderedReducer = reducer;
    // The last rebase update that is NOT part of the base state.
    var baseQueue = hook.baseQueue;
    // The last pending update that hasn't been processed yet.
    var pendingQueue = queue.pending;
    if (pendingQueue !== null) {
        // We have new updates that haven't been processed yet.
        // We'll add them to the base queue.
        if (baseQueue !== null) {
            // Merge the pending queue and the base queue.
            var baseFirst = baseQueue.next;
            baseQueue.next = pendingQueue.next;
            pendingQueue.next = baseFirst;
        }
        if (__DEV__) {
            if (current.baseQueue !== baseQueue) {
                // Internal invariant that should never happen, but feasibly could in
                // the future if we implement resuming, or some form of that.
                console.error("Internal error: Expected work-in-progress queue to be a clone. " + "This is a bug in React.");
            }
        }
        current.baseQueue = baseQueue = pendingQueue;
        queue.pending = null;
    }
    if (baseQueue !== null) {
        // We have a queue to process.
        var first = baseQueue.next;
        var newState = hook.baseState;
        var newBaseState = null;
        var newBaseQueueFirst = null;
        var newBaseQueueLast = null;
        var update = first;
        do {
            // An extra OffscreenLane bit is added to updates that were made to
            // a hidden tree, so that we can distinguish them from updates that were
            // already there when the tree was hidden.
            var updateLane = (0, react_fiber_lane_1.removeLanes)(update.lane, fiber_lane_constants_1.OffscreenLane);
            var isHiddenUpdate = updateLane !== update.lane;
            // Check if this update was made while the tree was hidden. If so, then
            // it's not a "base" update and we should disregard the extra base lanes
            // that were added to ReactFiberHooksCurrent.renderLanes when we entered the Offscreen tree.
            var shouldSkipUpdate = isHiddenUpdate ?
                !(0, react_fiber_lane_1.isSubsetOfLanes)((0, react_fiber_work_in_progress_1.getWorkInProgressRootRenderLanes)(), updateLane) :
                !(0, react_fiber_lane_1.isSubsetOfLanes)(react_fiber_hooks_shared_1.ReactFiberHooksCurrent.renderLanes, updateLane);
            if (shouldSkipUpdate) {
                // Priority is insufficient. Skip this update. If this is the first
                // skipped update, the previous update/state is the new base
                // update/state.
                var clone = {
                    lane: updateLane,
                    revertLane: update.revertLane,
                    action: update.action,
                    hasEagerState: update.hasEagerState,
                    eagerState: update.eagerState,
                    next: null
                };
                if (newBaseQueueLast === null) {
                    newBaseQueueFirst = newBaseQueueLast = clone;
                    newBaseState = newState;
                }
                else {
                    // @ts-ignore
                    newBaseQueueLast = newBaseQueueLast.next = clone;
                }
                // Update the remaining priority in the queue.
                // TODO: Don't need to accumulate this. Instead, we can remove
                // ReactFiberHooksCurrent.renderLanes from the original lanes.
                react_fiber_hooks_shared_1.ReactFiberHooksCurrent.renderingFiber.lanes = (0, react_fiber_lane_1.mergeLanes)(react_fiber_hooks_shared_1.ReactFiberHooksCurrent.renderingFiber.lanes, updateLane);
                (0, react_fiber_work_in_progress_1.markSkippedUpdateLanes)(updateLane);
            }
            else {
                // This update does have sufficient priority.
                // Check if this is an optimistic update.
                var revertLane = update.revertLane;
                if (!react_feature_flags_1.enableAsyncActions || revertLane === fiber_lane_constants_1.NoLane) {
                    // This is not an optimistic update, and we're going to apply it now.
                    // But, if there were earlier updates that were skipped, we need to
                    // leave this update in the queue so it can be rebased later.
                    if (newBaseQueueLast !== null) {
                        var clone = {
                            // This update is going to be committed so we never want uncommit
                            // it. Using NoLane works because 0 is a subset of all bitmasks, so
                            // this will never be skipped by the check above.
                            lane: fiber_lane_constants_1.NoLane,
                            revertLane: fiber_lane_constants_1.NoLane,
                            action: update.action,
                            hasEagerState: update.hasEagerState,
                            eagerState: update.eagerState,
                            next: null
                        };
                        // @ts-ignore
                        newBaseQueueLast = newBaseQueueLast.next = clone;
                    }
                }
                else {
                    // This is an optimistic update. If the "revert" priority is
                    // sufficient, don't apply the update. Otherwise, apply the update,
                    // but leave it in the queue so it can be either reverted or
                    // rebased in a subsequent render.
                    if ((0, react_fiber_lane_1.isSubsetOfLanes)(react_fiber_hooks_shared_1.ReactFiberHooksCurrent.renderLanes, revertLane)) {
                        // The transition that this optimistic update is associated with
                        // has finished. Pretend the update doesn't exist by skipping
                        // over it.
                        update = update.next;
                        continue;
                    }
                    else {
                        var clone = {
                            // Once we commit an optimistic update, we shouldn't uncommit it
                            // until the transition it is associated with has finished
                            // (represented by revertLane). Using NoLane here works because 0
                            // is a subset of all bitmasks, so this will never be skipped by
                            // the check above.
                            lane: fiber_lane_constants_1.NoLane,
                            // Reuse the same revertLane so we know when the transition
                            // has finished.
                            revertLane: update.revertLane,
                            action: update.action,
                            hasEagerState: update.hasEagerState,
                            eagerState: update.eagerState,
                            next: null
                        };
                        if (newBaseQueueLast === null) {
                            newBaseQueueFirst = newBaseQueueLast = clone;
                            newBaseState = newState;
                        }
                        else {
                            // @ts-ignore
                            newBaseQueueLast = newBaseQueueLast.next = clone;
                        }
                        // Update the remaining priority in the queue.
                        // TODO: Don't need to accumulate this. Instead, we can remove
                        // ReactFiberHooksCurrent.renderLanes from the original lanes.
                        react_fiber_hooks_shared_1.ReactFiberHooksCurrent.renderingFiber.lanes = (0, react_fiber_lane_1.mergeLanes)(react_fiber_hooks_shared_1.ReactFiberHooksCurrent.renderingFiber.lanes, revertLane);
                        (0, react_fiber_work_in_progress_1.markSkippedUpdateLanes)(revertLane);
                    }
                }
                // Process this update.
                var action = update.action;
                if (react_fiber_hooks_shared_1.ReactFiberHooksInfra.shouldDoubleInvokeUserFnsInHooksDEV) {
                    reducer(newState, action);
                }
                if (update.hasEagerState) {
                    // If this update is a state update (not a reducer) and was processed eagerly,
                    // we can use the eagerly computed state
                    newState = update.eagerState;
                }
                else {
                    newState = reducer(newState, action);
                }
            }
            update = update.next;
        } while (update !== null && update !== first);
        if (newBaseQueueLast === null) {
            newBaseState = newState;
        }
        else {
            newBaseQueueLast.next = newBaseQueueFirst;
        }
        // Mark that the fiber performed work, but only if the new state is
        // different from the current state.
        if (!(0, object_is_1.default)(newState, hook.memoizedState)) {
            (0, react_fiber_work_in_progress_receive_update_1.markWorkInProgressReceivedUpdate)();
        }
        hook.memoizedState = newState;
        hook.baseState = newBaseState;
        hook.baseQueue = newBaseQueueLast;
        queue.lastRenderedState = newState;
    }
    if (baseQueue === null) {
        // `queue.lanes` is used for entangling transitions. We can set it back to
        // zero once the queue is empty.
        queue.lanes = fiber_lane_constants_1.NoLanes;
    }
    var dispatch = queue.dispatch;
    return [hook.memoizedState, dispatch];
}
exports.updateReducerImpl = updateReducerImpl;
