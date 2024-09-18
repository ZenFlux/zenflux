"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCallerStackFrame = exports.markUpdateInDevTools = exports.enqueueRenderPhaseUpdate = exports.isRenderPhaseUpdate = exports.areHookInputsEqual = exports.updateWorkInProgressHook = exports.mountWorkInProgressHook = void 0;
var react_feature_flags_1 = require("@zenflux/react-shared/src/react-feature-flags");
var object_is_1 = require("@zenflux/react-shared/src/object-is");
var type_of_mode_1 = require("@zenflux/react-shared/src/react-internal-constants/type-of-mode");
var react_fiber_hooks_shared_1 = require("@zenflux/react-reconciler/src/react-fiber-hooks-shared");
var react_get_component_name_from_fiber_1 = require("@zenflux/react-reconciler/src/react-get-component-name-from-fiber");
var react_debug_tracing_1 = require("@zenflux/react-reconciler/src/react-debug-tracing");
var react_fiber_dev_tools_hook_1 = require("@zenflux/react-reconciler/src/react-fiber-dev-tools-hook");
if (react_feature_flags_1.enableUseMemoCacheHook) {
    react_fiber_hooks_shared_1.ReactFiberHooksInfra.createFunctionComponentUpdateQueue = function () {
        return {
            lastEffect: null,
            events: null,
            stores: null,
            memoCache: null
        };
    };
}
else {
    react_fiber_hooks_shared_1.ReactFiberHooksInfra.createFunctionComponentUpdateQueue = function () {
        return {
            lastEffect: null,
            events: null,
            stores: null
        };
    };
}
function mountWorkInProgressHook() {
    var hook = {
        memoizedState: null,
        baseState: null,
        baseQueue: null,
        queue: null,
        next: null
    };
    if (react_fiber_hooks_shared_1.ReactFiberHooksCurrent.workInProgressHook === null) {
        // This is the first hook in the list
        react_fiber_hooks_shared_1.ReactFiberHooksCurrent.renderingFiber.memoizedState = react_fiber_hooks_shared_1.ReactFiberHooksCurrent.workInProgressHook = hook;
    }
    else {
        // Append to the end of the list
        react_fiber_hooks_shared_1.ReactFiberHooksCurrent.workInProgressHook = react_fiber_hooks_shared_1.ReactFiberHooksCurrent.workInProgressHook.next = hook;
    }
    return react_fiber_hooks_shared_1.ReactFiberHooksCurrent.workInProgressHook;
}
exports.mountWorkInProgressHook = mountWorkInProgressHook;
function updateWorkInProgressHook() {
    // This function is used both for updates and for re-renders triggered by a
    // render phase update. It assumes there is either a current hook we can
    // clone, or a work-in-progress hook from a previous render pass that we can
    // use as a base.
    var nextCurrentHook;
    if (react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hook === null) {
        var current = react_fiber_hooks_shared_1.ReactFiberHooksCurrent.renderingFiber.alternate;
        if (current !== null) {
            nextCurrentHook = current.memoizedState;
        }
        else {
            nextCurrentHook = null;
        }
    }
    else {
        nextCurrentHook = react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hook.next;
    }
    var nextWorkInProgressHook;
    if (react_fiber_hooks_shared_1.ReactFiberHooksCurrent.workInProgressHook === null) {
        nextWorkInProgressHook = react_fiber_hooks_shared_1.ReactFiberHooksCurrent.renderingFiber.memoizedState;
    }
    else {
        nextWorkInProgressHook = react_fiber_hooks_shared_1.ReactFiberHooksCurrent.workInProgressHook.next;
    }
    if (nextWorkInProgressHook !== null) {
        // There's already a work-in-progress. Reuse it.
        react_fiber_hooks_shared_1.ReactFiberHooksCurrent.workInProgressHook = nextWorkInProgressHook;
        nextWorkInProgressHook = react_fiber_hooks_shared_1.ReactFiberHooksCurrent.workInProgressHook.next;
        react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hook = nextCurrentHook;
    }
    else {
        // Clone from the current hook.
        if (nextCurrentHook === null) {
            var currentFiber = react_fiber_hooks_shared_1.ReactFiberHooksCurrent.renderingFiber.alternate;
            if (currentFiber === null) {
                // This is the initial render. This branch is reached when the component
                // suspends, resumes, then renders an additional hook.
                // Should never be reached because we should switch to the mount dispatcher first.
                throw new Error("Update hook called on initial render. This is likely a bug in React. Please file an issue.");
            }
            else {
                // This is an update. We should always have a current hook.
                throw new Error("Rendered more hooks than during the previous render.");
            }
        }
        react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hook = nextCurrentHook;
        var newHook = {
            memoizedState: react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hook.memoizedState,
            baseState: react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hook.baseState,
            baseQueue: react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hook.baseQueue,
            queue: react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hook.queue,
            next: null
        };
        if (react_fiber_hooks_shared_1.ReactFiberHooksCurrent.workInProgressHook === null) {
            // This is the first hook in the list.
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.renderingFiber.memoizedState = react_fiber_hooks_shared_1.ReactFiberHooksCurrent.workInProgressHook = newHook;
        }
        else {
            // Append to the end of the list.
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.workInProgressHook = react_fiber_hooks_shared_1.ReactFiberHooksCurrent.workInProgressHook.next = newHook;
        }
    }
    return react_fiber_hooks_shared_1.ReactFiberHooksCurrent.workInProgressHook;
}
exports.updateWorkInProgressHook = updateWorkInProgressHook;
function areHookInputsEqual(nextDeps, prevDeps) {
    if (__DEV__) {
        if (react_fiber_hooks_shared_1.ReactFiberHooksInfra.ignorePreviousDependencies) {
            // Only true when this component is being hot reloaded.
            return false;
        }
    }
    if (prevDeps === null) {
        if (__DEV__) {
            console.error("%s received a final argument during this render, but not during " + "the previous render. Even though the final argument is optional, " + "its type cannot change between renders.", react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev);
        }
        return false;
    }
    if (__DEV__) {
        // Don't bother comparing lengths in prod because these arrays should be
        // passed inline.
        if (nextDeps.length !== prevDeps.length) {
            console.error("The final argument passed to %s changed size between renders. The " + "order and size of this array must remain constant.\n\n" + "Previous: %s\n" + "Incoming: %s", react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev, "[".concat(prevDeps.join(", "), "]"), "[".concat(nextDeps.join(", "), "]"));
        }
    }
    // $FlowFixMe[incompatible-use] found when upgrading Flow
    for (var i = 0; i < prevDeps.length && i < nextDeps.length; i++) {
        // $FlowFixMe[incompatible-use] found when upgrading Flow
        if ((0, object_is_1.default)(nextDeps[i], prevDeps[i])) {
            continue;
        }
        return false;
    }
    return true;
}
exports.areHookInputsEqual = areHookInputsEqual;
function isRenderPhaseUpdate(fiber) {
    var alternate = fiber.alternate;
    return fiber === react_fiber_hooks_shared_1.ReactFiberHooksCurrent.renderingFiber || alternate !== null && alternate === react_fiber_hooks_shared_1.ReactFiberHooksCurrent.renderingFiber;
}
exports.isRenderPhaseUpdate = isRenderPhaseUpdate;
function enqueueRenderPhaseUpdate(queue, update) {
    // This is a render phase update. Stash it in a lazily-created map of
    // queue -> linked list of updates. After this render pass, we'll restart
    // and apply the stashed updates on top of the work-in-progress hook.
    react_fiber_hooks_shared_1.ReactFiberHooksFlags.didScheduleRenderPhaseUpdateDuringThisPass = react_fiber_hooks_shared_1.ReactFiberHooksFlags.didScheduleRenderPhaseUpdate = true;
    var pending = queue.pending;
    if (pending === null) {
        // This is the first update. Create a circular list.
        update.next = update;
    }
    else {
        update.next = pending.next;
        pending.next = update;
    }
    queue.pending = update;
}
exports.enqueueRenderPhaseUpdate = enqueueRenderPhaseUpdate;
function markUpdateInDevTools(fiber, lane, action) {
    if (__DEV__) {
        if (react_feature_flags_1.enableDebugTracing) {
            if (fiber.mode & type_of_mode_1.TypeOfMode.DebugTracingMode) {
                var name_1 = (0, react_get_component_name_from_fiber_1.default)(fiber) || "Unknown";
                (0, react_debug_tracing_1.logStateUpdateScheduled)(name_1, lane, action);
            }
        }
    }
    if (react_feature_flags_1.enableSchedulingProfiler) {
        (0, react_fiber_dev_tools_hook_1.markStateUpdateScheduled)(fiber, lane);
    }
}
exports.markUpdateInDevTools = markUpdateInDevTools;
function getCallerStackFrame() {
    var _a;
    // not-used: eslint-disable-next-line react-internal/prod-error-codes
    var stackFrames = (_a = new Error("Error message").stack) === null || _a === void 0 ? void 0 : _a.split("\n");
    if (!stackFrames) {
        throw new Error("getCallerStackFrame failed to parse stack frame");
    }
    // Some browsers (e.g. Chrome) include the error message in the stack
    // but others (e.g. Firefox) do not.
    if (react_fiber_hooks_shared_1.ReactFiberHooksInfra.stackContainsErrorMessage === null) {
        react_fiber_hooks_shared_1.ReactFiberHooksInfra.stackContainsErrorMessage = stackFrames[0].includes("Error message");
    }
    return react_fiber_hooks_shared_1.ReactFiberHooksInfra.stackContainsErrorMessage ? stackFrames.slice(3, 4).join("\n") : stackFrames.slice(2, 3).join("\n");
}
exports.getCallerStackFrame = getCallerStackFrame;
