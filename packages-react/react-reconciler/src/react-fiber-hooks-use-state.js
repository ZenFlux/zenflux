"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dispatchSetState = exports.mountState = exports.mountStateImpl = exports.rerenderState = exports.updateState = exports.basicStateReducer = void 0;
var object_is_1 = require("@zenflux/react-shared/src/object-is");
var react_shared_internals_1 = require("@zenflux/react-shared/src/react-shared-internals");
var fiber_lane_constants_1 = require("@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants");
var react_entangled_transaction_1 = require("@zenflux/react-reconciler/src/react-entangled-transaction");
var react_fiber_concurrent_updates_1 = require("@zenflux/react-reconciler/src/react-fiber-concurrent-updates");
var react_fiber_hooks_infra_1 = require("@zenflux/react-reconciler/src/react-fiber-hooks-infra");
var react_fiber_hooks_shared_1 = require("@zenflux/react-reconciler/src/react-fiber-hooks-shared");
var react_fiber_hooks_use_reducer_1 = require("@zenflux/react-reconciler/src/react-fiber-hooks-use-reducer");
var react_fiber_work_in_progress_request_lane_1 = require("@zenflux/react-reconciler/src/react-fiber-work-in-progress-request-lane");
var react_fiber_work_schedule_update_1 = require("@zenflux/react-reconciler/src/react-fiber-work-schedule-update");
var ReactCurrentDispatcher = react_shared_internals_1.default.ReactCurrentDispatcher;
function basicStateReducer(state, action) {
    // $FlowFixMe[incompatible-use]: Flow doesn't like mixed types
    // @ts-ignore
    return typeof action === "function" ? action(state) : action;
}
exports.basicStateReducer = basicStateReducer;
function updateState(initialState) {
    return (0, react_fiber_hooks_use_reducer_1.updateReducer)(basicStateReducer, initialState);
}
exports.updateState = updateState;
function rerenderState(initialState) {
    return (0, react_fiber_hooks_use_reducer_1.rerenderReducer)(basicStateReducer, initialState);
}
exports.rerenderState = rerenderState;
function mountStateImpl(initialState) {
    var hook = (0, react_fiber_hooks_infra_1.mountWorkInProgressHook)();
    if (typeof initialState === "function") {
        // $FlowFixMe[incompatible-use]: Flow doesn't like mixed types
        // @ts-ignore
        initialState = initialState();
    }
    hook.memoizedState = hook.baseState = initialState;
    var queue = {
        pending: null,
        lanes: fiber_lane_constants_1.NoLanes,
        dispatch: null,
        lastRenderedReducer: basicStateReducer,
        lastRenderedState: initialState
    };
    hook.queue = queue;
    return hook;
}
exports.mountStateImpl = mountStateImpl;
function mountState(initialState) {
    var hook = mountStateImpl(initialState);
    var queue = hook.queue;
    var dispatch = dispatchSetState.bind(null, react_fiber_hooks_shared_1.ReactFiberHooksCurrent.renderingFiber, queue);
    queue.dispatch = dispatch;
    return [hook.memoizedState, dispatch];
}
exports.mountState = mountState;
;
function dispatchSetState(fiber, queue, action) {
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
        var alternate = fiber.alternate;
        if (fiber.lanes === fiber_lane_constants_1.NoLanes && (alternate === null || alternate.lanes === fiber_lane_constants_1.NoLanes)) {
            // The queue is currently empty, which means we can eagerly compute the
            // next state before entering the render phase. If the new state is the
            // same as the current state, we may be able to bail out entirely.
            var lastRenderedReducer = queue.lastRenderedReducer;
            if (lastRenderedReducer !== null) {
                var prevDispatcher = void 0;
                if (__DEV__) {
                    prevDispatcher = ReactCurrentDispatcher.current;
                    ReactCurrentDispatcher.current = react_fiber_hooks_shared_1.ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onUpdate;
                }
                try {
                    var currentState = queue.lastRenderedState;
                    var eagerState = lastRenderedReducer(currentState, action);
                    // Stash the eagerly computed state, and the reducer used to compute
                    // it, on the update object. If the reducer hasn't changed by the
                    // time we enter the render phase, then the eager state can be used
                    // without calling the reducer again.
                    update.hasEagerState = true;
                    update.eagerState = eagerState;
                    if ((0, object_is_1.default)(eagerState, currentState)) {
                        // Fast path. We can bail out without scheduling React to re-render.
                        // It's still possible that we'll need to rebase this update later,
                        // if the component re-renders for a different reason and by that
                        // time the reducer has changed.
                        // TODO: Do we still need to entangle transitions in this case?
                        (0, react_fiber_concurrent_updates_1.enqueueConcurrentHookUpdateAndEagerlyBailout)(fiber, queue, update);
                        return;
                    }
                }
                catch (error) { // Suppress the error. It will throw again in the render phase.
                }
                finally {
                    if (__DEV__) {
                        ReactCurrentDispatcher.current = prevDispatcher !== null && prevDispatcher !== void 0 ? prevDispatcher : null;
                    }
                }
            }
        }
        var root = (0, react_fiber_concurrent_updates_1.enqueueConcurrentHookUpdate)(fiber, queue, update, lane);
        if (root !== null) {
            (0, react_fiber_work_schedule_update_1.scheduleUpdateOnFiber)(root, fiber, lane);
            (0, react_entangled_transaction_1.entangleTransitionUpdate)(root, queue, lane);
        }
    }
    (0, react_fiber_hooks_infra_1.markUpdateInDevTools)(fiber, lane, action);
}
exports.dispatchSetState = dispatchSetState;
