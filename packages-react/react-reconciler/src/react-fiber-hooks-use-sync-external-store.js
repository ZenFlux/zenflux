"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSyncExternalStore = exports.mountSyncExternalStore = void 0;
var object_is_1 = require("@zenflux/react-shared/src/object-is");
var fiber_flags_1 = require("@zenflux/react-shared/src/react-internal-constants/fiber-flags");
var hook_flags_1 = require("@zenflux/react-shared/src/react-internal-constants/hook-flags");
var fiber_lane_constants_1 = require("@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants");
var react_fiber_concurrent_updates_1 = require("@zenflux/react-reconciler/src/react-fiber-concurrent-updates");
var react_fiber_hooks_infra_1 = require("@zenflux/react-reconciler/src/react-fiber-hooks-infra");
var react_fiber_hooks_shared_1 = require("@zenflux/react-reconciler/src/react-fiber-hooks-shared");
var react_fiber_hooks_use_effect_1 = require("@zenflux/react-reconciler/src/react-fiber-hooks-use-effect");
var react_fiber_hydration_is_hydrating_1 = require("@zenflux/react-reconciler/src/react-fiber-hydration-is-hydrating");
var react_fiber_work_in_progress_1 = require("@zenflux/react-reconciler/src/react-fiber-work-in-progress");
var react_fiber_work_in_progress_receive_update_1 = require("@zenflux/react-reconciler/src/react-fiber-work-in-progress-receive-update");
var react_fiber_work_schedule_update_1 = require("@zenflux/react-reconciler/src/react-fiber-work-schedule-update");
function updateStoreInstance(fiber, inst, nextSnapshot, getSnapshot) {
    // These are updated in the passive phase
    inst.value = nextSnapshot;
    inst.getSnapshot = getSnapshot;
    // Something may have been mutated in between render and commit. This could
    // have been in an event that fired before the passive effects, or it could
    // have been in a layout effect. In that case, we would have used the old
    // snapsho and getSnapshot values to bail out. We need to check one more time.
    if (checkIfSnapshotChanged(inst)) {
        // Force a re-render.
        forceStoreRerender(fiber);
    }
}
function checkIfSnapshotChanged(inst) {
    var latestGetSnapshot = inst.getSnapshot;
    var prevValue = inst.value;
    try {
        var nextValue = latestGetSnapshot();
        return !(0, object_is_1.default)(prevValue, nextValue);
    }
    catch (error) {
        return true;
    }
}
function forceStoreRerender(fiber) {
    var root = (0, react_fiber_concurrent_updates_1.enqueueConcurrentRenderForLane)(fiber, fiber_lane_constants_1.SyncLane);
    if (root !== null) {
        (0, react_fiber_work_schedule_update_1.scheduleUpdateOnFiber)(root, fiber, fiber_lane_constants_1.SyncLane);
    }
}
function pushStoreConsistencyCheck(fiber, getSnapshot, renderedSnapshot) {
    fiber.flags |= fiber_flags_1.FiberFlags.StoreConsistency;
    var check = {
        getSnapshot: getSnapshot,
        value: renderedSnapshot
    };
    var componentUpdateQueue = react_fiber_hooks_shared_1.ReactFiberHooksCurrent.renderingFiber.updateQueue;
    if (componentUpdateQueue === null) {
        componentUpdateQueue = react_fiber_hooks_shared_1.ReactFiberHooksInfra.createFunctionComponentUpdateQueue();
        react_fiber_hooks_shared_1.ReactFiberHooksCurrent.renderingFiber.updateQueue = componentUpdateQueue;
        componentUpdateQueue.stores = [check];
    }
    else {
        var stores = componentUpdateQueue.stores;
        if (stores === null) {
            componentUpdateQueue.stores = [check];
        }
        else {
            stores.push(check);
        }
    }
}
function subscribeToStore(fiber, inst, subscribe) {
    var handleStoreChange = function () {
        // The store changed. Check if the snapshot changed since the last time we
        // read from the store.
        if (checkIfSnapshotChanged(inst)) {
            // Force a re-render.
            forceStoreRerender(fiber);
        }
    };
    // Subscribe to the store and return a clean-up function.
    return subscribe(handleStoreChange);
}
function mountSyncExternalStore(subscribe, getSnapshot, getServerSnapshot) {
    var fiber = react_fiber_hooks_shared_1.ReactFiberHooksCurrent.renderingFiber;
    var hook = (0, react_fiber_hooks_infra_1.mountWorkInProgressHook)();
    var nextSnapshot;
    var _isHydrating = (0, react_fiber_hydration_is_hydrating_1.isHydrating)();
    if (_isHydrating) {
        if (getServerSnapshot === undefined) {
            throw new Error("Missing getServerSnapshot, which is required for " + "server-rendered content. Will revert to client rendering.");
        }
        nextSnapshot = getServerSnapshot();
        if (__DEV__) {
            if (!react_fiber_hooks_shared_1.ReactFiberHooksFlags.didWarnUncachedGetSnapshot) {
                if (nextSnapshot !== getServerSnapshot()) {
                    console.error("The result of getServerSnapshot should be cached to avoid an infinite loop");
                    react_fiber_hooks_shared_1.ReactFiberHooksFlags.didWarnUncachedGetSnapshot = true;
                }
            }
        }
    }
    else {
        nextSnapshot = getSnapshot();
        if (__DEV__) {
            if (!react_fiber_hooks_shared_1.ReactFiberHooksFlags.didWarnUncachedGetSnapshot) {
                var cachedSnapshot = getSnapshot();
                if (!(0, object_is_1.default)(nextSnapshot, cachedSnapshot)) {
                    console.error("The result of getSnapshot should be cached to avoid an infinite loop");
                    react_fiber_hooks_shared_1.ReactFiberHooksFlags.didWarnUncachedGetSnapshot = true;
                }
            }
        }
        // Unless we're rendering a blocking lane, schedule a consistency check.
        // Right before committing, we will walk the tree and check if any of the
        // stores were mutated.
        //
        // We won't do this if we're hydrating server-rendered content, because if
        // the content is stale, it's already visible anyway. Instead we'll patch
        // it up in a passive effect.
        var root = (0, react_fiber_work_in_progress_1.getWorkInProgressRoot)();
        if (root === null) {
            throw new Error("Expected a work-in-progress root. This is a bug in React. Please file an issue.");
        }
        var rootRenderLanes = (0, react_fiber_work_in_progress_1.getWorkInProgressRootRenderLanes)();
        if (!(0, fiber_lane_constants_1.includesBlockingLane)(root, rootRenderLanes)) {
            pushStoreConsistencyCheck(fiber, getSnapshot, nextSnapshot);
        }
    }
    // Read the current snapshot from the store on every render. This breaks the
    // normal rules of React, and only works because store updates are
    // always synchronous.
    hook.memoizedState = nextSnapshot;
    var inst = {
        value: nextSnapshot,
        getSnapshot: getSnapshot
    };
    hook.queue = inst;
    // Schedule an effect to subscribe to the store.
    (0, react_fiber_hooks_use_effect_1.mountEffect)(subscribeToStore.bind(null, fiber, inst, subscribe), [subscribe]);
    // Schedule an effect to update the mutable instance fields. We will update
    // this whenever subscribe, getSnapshot, or value changes. Because there's no
    // clean-up function, and we track the deps correctly, we can call pushEffect
    // directly, without storing any additional state. For the same reason, we
    // don't need to set a static flag, either.
    fiber.flags |= fiber_flags_1.FiberFlags.Passive;
    (0, react_fiber_hooks_use_effect_1.pushEffect)(hook_flags_1.HookFlags.HasEffect | hook_flags_1.HookFlags.Passive, updateStoreInstance.bind(null, fiber, inst, nextSnapshot, getSnapshot), (0, react_fiber_hooks_use_effect_1.createEffectInstance)(), null);
    return nextSnapshot;
}
exports.mountSyncExternalStore = mountSyncExternalStore;
function updateSyncExternalStore(subscribe, getSnapshot, getServerSnapshot) {
    var fiber = react_fiber_hooks_shared_1.ReactFiberHooksCurrent.renderingFiber;
    var hook = (0, react_fiber_hooks_infra_1.updateWorkInProgressHook)();
    // Read the current snapshot from the store on every render. This breaks the
    // normal rules of React, and only works because store updates are
    // always synchronous.
    var nextSnapshot;
    var _isHydrating = (0, react_fiber_hydration_is_hydrating_1.isHydrating)();
    if (_isHydrating) {
        // Needed for strict mode double render
        if (getServerSnapshot === undefined) {
            throw new Error("Missing getServerSnapshot, which is required for " + "server-rendered content. Will revert to client rendering.");
        }
        nextSnapshot = getServerSnapshot();
    }
    else {
        nextSnapshot = getSnapshot();
        if (__DEV__) {
            if (!react_fiber_hooks_shared_1.ReactFiberHooksFlags.didWarnUncachedGetSnapshot) {
                var cachedSnapshot = getSnapshot();
                if (!(0, object_is_1.default)(nextSnapshot, cachedSnapshot)) {
                    console.error("The result of getSnapshot should be cached to avoid an infinite loop");
                    react_fiber_hooks_shared_1.ReactFiberHooksFlags.didWarnUncachedGetSnapshot = true;
                }
            }
        }
    }
    var prevSnapshot = (react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hook || hook).memoizedState;
    var snapshotChanged = !(0, object_is_1.default)(prevSnapshot, nextSnapshot);
    if (snapshotChanged) {
        hook.memoizedState = nextSnapshot;
        (0, react_fiber_work_in_progress_receive_update_1.markWorkInProgressReceivedUpdate)();
    }
    var inst = hook.queue;
    (0, react_fiber_hooks_use_effect_1.updateEffect)(subscribeToStore.bind(null, fiber, inst, subscribe), [subscribe]);
    // Whenever getSnapshot or subscribe changes, we need to check in the
    // commit phase if there was an interleaved mutation. In concurrent mode
    // this can happen all the time, but even in synchronous mode, an earlier
    // effect may have mutated the store.
    if (inst.getSnapshot !== getSnapshot || snapshotChanged || // Check if the subscribe function changed. We can save some memory by
        // checking whether we scheduled a subscription effect above.
        react_fiber_hooks_shared_1.ReactFiberHooksCurrent.workInProgressHook !== null && react_fiber_hooks_shared_1.ReactFiberHooksCurrent.workInProgressHook.memoizedState.tag & hook_flags_1.HookFlags.HasEffect) {
        fiber.flags |= fiber_flags_1.FiberFlags.Passive;
        (0, react_fiber_hooks_use_effect_1.pushEffect)(hook_flags_1.HookFlags.HasEffect | hook_flags_1.HookFlags.Passive, updateStoreInstance.bind(null, fiber, inst, nextSnapshot, getSnapshot), (0, react_fiber_hooks_use_effect_1.createEffectInstance)(), null);
        // Unless we're rendering a blocking lane, schedule a consistency check.
        // Right before committing, we will walk the tree and check if any of the
        // stores were mutated.
        var root = (0, react_fiber_work_in_progress_1.getWorkInProgressRoot)();
        if (root === null) {
            throw new Error("Expected a work-in-progress root. This is a bug in React. Please file an issue.");
        }
        if (!_isHydrating && !(0, fiber_lane_constants_1.includesBlockingLane)(root, react_fiber_hooks_shared_1.ReactFiberHooksCurrent.renderLanes)) {
            pushStoreConsistencyCheck(fiber, getSnapshot, nextSnapshot);
        }
    }
    return nextSnapshot;
}
exports.updateSyncExternalStore = updateSyncExternalStore;
