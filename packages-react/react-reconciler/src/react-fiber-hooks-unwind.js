"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetHooksOnUnwind = void 0;
var fiber_lane_constants_1 = require("@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants");
var react_fiber_hooks_shared_1 = require("@zenflux/react-reconciler/src/react-fiber-hooks-shared");
function resetHooksOnUnwind(workInProgress) {
    if (react_fiber_hooks_shared_1.ReactFiberHooksFlags.didScheduleRenderPhaseUpdate) {
        // There were render phase updates. These are only valid for this render
        // phase, which we are now aborting. Remove the updates from the queues so
        // they do not persist to the next render. Do not remove updates from hooks
        // that weren't processed.
        //
        // Only reset the updates from the queue if it has a clone. If it does
        // not have a clone, that means it wasn't processed, and the updates were
        // scheduled before we entered the render phase.
        var hook = workInProgress.memoizedState;
        while (hook !== null) {
            var queue = hook.queue;
            if (queue !== null) {
                queue.pending = null;
            }
            hook = hook.next;
        }
        react_fiber_hooks_shared_1.ReactFiberHooksFlags.didScheduleRenderPhaseUpdate = false;
    }
    react_fiber_hooks_shared_1.ReactFiberHooksCurrent.renderLanes = fiber_lane_constants_1.NoLanes;
    react_fiber_hooks_shared_1.ReactFiberHooksCurrent.renderingFiber = null;
    react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hook = null;
    react_fiber_hooks_shared_1.ReactFiberHooksCurrent.workInProgressHook = null;
    if (__DEV__) {
        react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookTypesDev = null;
        react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookTypesUpdateIndexDev = -1;
        react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = null;
    }
    react_fiber_hooks_shared_1.ReactFiberHooksFlags.didScheduleRenderPhaseUpdateDuringThisPass = false;
    react_fiber_hooks_shared_1.ReactFiberHooksCurrent.localIdCounter = 0;
    react_fiber_hooks_shared_1.ReactFiberHooksCurrent.thenableIndexCounter = 0;
    react_fiber_hooks_shared_1.ReactFiberHooksCurrent.thenableState = null;
}
exports.resetHooksOnUnwind = resetHooksOnUnwind;
