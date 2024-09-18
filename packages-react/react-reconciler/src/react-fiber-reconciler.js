"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.injectIntoDevTools = exports.findHostInstanceWithNoPortals = exports.findHostInstanceWithWarning = exports.findHostInstance = exports.runWithPriority = exports.getCurrentUpdatePriority = exports.attemptHydrationAtCurrentPriority = exports.attemptContinuousHydration = exports.attemptDiscreteHydration = exports.attemptSynchronousHydration = exports.getPublicRootInstance = exports.flushPassiveEffects = exports.isAlreadyRendering = exports.flushSync = exports.discreteUpdates = exports.deferredUpdates = exports.batchedUpdates = exports.createPortal = exports.updateContainer = exports.createHydrationContainer = exports.createContainer = exports.shouldSuspend = exports.shouldError = exports.startHostTransition = exports.observeVisibleRects = exports.focusWithin = exports.findBoundingRects = exports.findAllNodes = exports.getFindAllNodesFailureDescription = exports.createTextSelector = exports.createTestNameSelector = exports.createRoleSelector = exports.createHasPseudoClassSelector = exports.createComponentSelector = void 0;
var react_instance_map_1 = require("@zenflux/react-shared/src/react-instance-map");
var react_shared_internals_1 = require("@zenflux/react-shared/src/react-shared-internals");
var react_version_1 = require("@zenflux/react-shared/src/react-version");
var fiber_lane_constants_1 = require("@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants");
var work_tags_1 = require("@zenflux/react-shared/src/react-internal-constants/work-tags");
var type_of_mode_1 = require("@zenflux/react-shared/src/react-internal-constants/type-of-mode");
var react_current_fiber_1 = require("@zenflux/react-reconciler/src/react-current-fiber");
var react_event_priorities_1 = require("@zenflux/react-reconciler/src/react-event-priorities");
Object.defineProperty(exports, "getCurrentUpdatePriority", { enumerable: true, get: function () { return react_event_priorities_1.getCurrentUpdatePriority; } });
Object.defineProperty(exports, "runWithPriority", { enumerable: true, get: function () { return react_event_priorities_1.runWithPriority; } });
var react_fiber_concurrent_updates_1 = require("@zenflux/react-reconciler/src/react-fiber-concurrent-updates");
var react_fiber_dev_tools_hook_1 = require("@zenflux/react-reconciler/src/react-fiber-dev-tools-hook");
var react_fiber_hot_reloading_1 = require("@zenflux/react-reconciler/src/react-fiber-hot-reloading");
var react_fiber_hot_reloading_resvole_1 = require("@zenflux/react-reconciler/src/react-fiber-hot-reloading-resvole");
var react_fiber_lane_1 = require("@zenflux/react-reconciler/src/react-fiber-lane");
var react_fiber_reconciler_shared_dev_1 = require("@zenflux/react-reconciler/src/react-fiber-reconciler-shared-dev");
var react_fiber_shell_hydration_1 = require("@zenflux/react-reconciler/src/react-fiber-shell-hydration");
var react_fiber_tree_reflection_1 = require("@zenflux/react-reconciler/src/react-fiber-tree-reflection");
var react_fiber_work_flush_sync_1 = require("@zenflux/react-reconciler/src/react-fiber-work-flush-sync");
Object.defineProperty(exports, "flushSync", { enumerable: true, get: function () { return react_fiber_work_flush_sync_1.flushSync; } });
var react_fiber_work_in_progress_request_lane_1 = require("@zenflux/react-reconciler/src/react-fiber-work-in-progress-request-lane");
var react_fiber_work_loop_1 = require("@zenflux/react-reconciler/src/react-fiber-work-loop");
Object.defineProperty(exports, "batchedUpdates", { enumerable: true, get: function () { return react_fiber_work_loop_1.batchedUpdates; } });
Object.defineProperty(exports, "deferredUpdates", { enumerable: true, get: function () { return react_fiber_work_loop_1.deferredUpdates; } });
Object.defineProperty(exports, "discreteUpdates", { enumerable: true, get: function () { return react_fiber_work_loop_1.discreteUpdates; } });
Object.defineProperty(exports, "isAlreadyRendering", { enumerable: true, get: function () { return react_fiber_work_loop_1.isAlreadyRendering; } });
var react_fiber_work_passive_effects_1 = require("@zenflux/react-reconciler/src/react-fiber-work-passive-effects");
Object.defineProperty(exports, "flushPassiveEffects", { enumerable: true, get: function () { return react_fiber_work_passive_effects_1.flushPassiveEffects; } });
var react_fiber_work_schedule_update_1 = require("@zenflux/react-reconciler/src/react-fiber-work-schedule-update");
var react_get_component_name_from_fiber_1 = require("@zenflux/react-reconciler/src/react-get-component-name-from-fiber");
var react_fiber_should_error_1 = require("@zenflux/react-reconciler/src/react-fiber-should-error");
var react_fiber_should_suspend_1 = require("@zenflux/react-reconciler/src/react-fiber-should-suspend");
// --- Problematic callbacks find better solution
// eslint-disable-next-line import/order
require("@zenflux/react-reconciler/src/react-fiber-work-on-root");
// eslint-disable-next-line import/order
require("@zenflux/react-reconciler/src/react-fiber-work-on-root-schedule");
// eslint-disable-next-line import/order
require("@zenflux/react-reconciler/src/react-fiber-work-double-invoke-effects-in-dev");
// ---
var react_test_selectors_1 = require("@zenflux/react-reconciler/src/react-test-selectors");
Object.defineProperty(exports, "createComponentSelector", { enumerable: true, get: function () { return react_test_selectors_1.createComponentSelector; } });
Object.defineProperty(exports, "createHasPseudoClassSelector", { enumerable: true, get: function () { return react_test_selectors_1.createHasPseudoClassSelector; } });
Object.defineProperty(exports, "createRoleSelector", { enumerable: true, get: function () { return react_test_selectors_1.createRoleSelector; } });
Object.defineProperty(exports, "createTestNameSelector", { enumerable: true, get: function () { return react_test_selectors_1.createTestNameSelector; } });
Object.defineProperty(exports, "createTextSelector", { enumerable: true, get: function () { return react_test_selectors_1.createTextSelector; } });
Object.defineProperty(exports, "getFindAllNodesFailureDescription", { enumerable: true, get: function () { return react_test_selectors_1.getFindAllNodesFailureDescription; } });
Object.defineProperty(exports, "findAllNodes", { enumerable: true, get: function () { return react_test_selectors_1.findAllNodes; } });
Object.defineProperty(exports, "findBoundingRects", { enumerable: true, get: function () { return react_test_selectors_1.findBoundingRects; } });
Object.defineProperty(exports, "focusWithin", { enumerable: true, get: function () { return react_test_selectors_1.focusWithin; } });
Object.defineProperty(exports, "observeVisibleRects", { enumerable: true, get: function () { return react_test_selectors_1.observeVisibleRects; } });
var react_fiber_hooks_1 = require("@zenflux/react-reconciler/src/react-fiber-hooks");
Object.defineProperty(exports, "startHostTransition", { enumerable: true, get: function () { return react_fiber_hooks_1.startHostTransition; } });
var react_fiber_should_error_2 = require("@zenflux/react-reconciler/src/react-fiber-should-error");
Object.defineProperty(exports, "shouldError", { enumerable: true, get: function () { return react_fiber_should_error_2.shouldError; } });
var react_fiber_should_suspend_2 = require("@zenflux/react-reconciler/src/react-fiber-should-suspend");
Object.defineProperty(exports, "shouldSuspend", { enumerable: true, get: function () { return react_fiber_should_suspend_2.shouldSuspend; } });
var react_fiber_reconciler_contianer_1 = require("@zenflux/react-reconciler/src/react-fiber-reconciler-contianer");
Object.defineProperty(exports, "createContainer", { enumerable: true, get: function () { return react_fiber_reconciler_contianer_1.createContainer; } });
Object.defineProperty(exports, "createHydrationContainer", { enumerable: true, get: function () { return react_fiber_reconciler_contianer_1.createHydrationContainer; } });
Object.defineProperty(exports, "updateContainer", { enumerable: true, get: function () { return react_fiber_reconciler_contianer_1.updateContainer; } });
var react_portal_1 = require("@zenflux/react-reconciler/src/react-portal");
Object.defineProperty(exports, "createPortal", { enumerable: true, get: function () { return react_portal_1.createPortal; } });
var getPublicInstance = globalThis.__RECONCILER__CONFIG__.getPublicInstance;
if (__DEV__) {
    react_fiber_reconciler_shared_dev_1.default.didWarnAboutNestedUpdates = false;
    react_fiber_reconciler_shared_dev_1.default.didWarnAboutFindNodeInStrictMode = {};
}
function findHostInstance(component) {
    var fiber = (0, react_instance_map_1.get)(component);
    if (fiber === undefined) {
        if (typeof component.render === "function") {
            throw new Error("Unable to find node on an unmounted component.");
        }
        else {
            var keys = Object.keys(component).join(",");
            throw new Error("Argument appears to not be a ReactComponent. Keys: ".concat(keys));
        }
    }
    var hostFiber = (0, react_fiber_tree_reflection_1.findCurrentHostFiber)(fiber);
    if (hostFiber === null) {
        return null;
    }
    return getPublicInstance(hostFiber.stateNode);
}
exports.findHostInstance = findHostInstance;
function findHostInstanceWithWarning(component, methodName) {
    if (__DEV__) {
        var fiber = (0, react_instance_map_1.get)(component);
        if (fiber === undefined) {
            if (typeof component.render === "function") {
                throw new Error("Unable to find node on an unmounted component.");
            }
            else {
                var keys = Object.keys(component).join(",");
                throw new Error("Argument appears to not be a ReactComponent. Keys: ".concat(keys));
            }
        }
        var hostFiber = (0, react_fiber_tree_reflection_1.findCurrentHostFiber)(fiber);
        if (hostFiber === null) {
            return null;
        }
        if (hostFiber.mode & type_of_mode_1.TypeOfMode.StrictLegacyMode) {
            var componentName = (0, react_get_component_name_from_fiber_1.default)(fiber) || "Component";
            if (!react_fiber_reconciler_shared_dev_1.default.didWarnAboutFindNodeInStrictMode[componentName]) {
                react_fiber_reconciler_shared_dev_1.default.didWarnAboutFindNodeInStrictMode[componentName] = true;
                var previousFiber = react_current_fiber_1.current;
                try {
                    (0, react_current_fiber_1.setCurrentFiber)(hostFiber);
                    if (fiber.mode & type_of_mode_1.TypeOfMode.StrictLegacyMode) {
                        console.error("%s is deprecated in StrictMode. " + "%s was passed an instance of %s which is inside StrictMode. " + "Instead, add a ref directly to the element you want to reference. " + "Learn more about using refs safely here: " + "https://reactjs.org/link/strict-mode-find-node", methodName, methodName, componentName);
                    }
                    else {
                        console.error("%s is deprecated in StrictMode. " + "%s was passed an instance of %s which renders StrictMode children. " + "Instead, add a ref directly to the element you want to reference. " + "Learn more about using refs safely here: " + "https://reactjs.org/link/strict-mode-find-node", methodName, methodName, componentName);
                    }
                }
                finally {
                    // Ideally this should reset to previous but this shouldn't be called in
                    // render and there's another warning for that anyway.
                    if (previousFiber) {
                        (0, react_current_fiber_1.setCurrentFiber)(previousFiber);
                    }
                    else {
                        (0, react_current_fiber_1.resetCurrentFiber)();
                    }
                }
            }
        }
        return getPublicInstance(hostFiber.stateNode);
    }
    return findHostInstance(component);
}
exports.findHostInstanceWithWarning = findHostInstanceWithWarning;
function getPublicRootInstance(container) {
    var containerFiber = container.current;
    if (!containerFiber.child) {
        return null;
    }
    switch (containerFiber.child.tag) {
        case work_tags_1.WorkTag.HostSingleton:
        case work_tags_1.WorkTag.HostComponent:
            return getPublicInstance(containerFiber.child.stateNode);
        default:
            return containerFiber.child.stateNode;
    }
}
exports.getPublicRootInstance = getPublicRootInstance;
function attemptSynchronousHydration(fiber) {
    switch (fiber.tag) {
        case work_tags_1.WorkTag.HostRoot: {
            var root = fiber.stateNode;
            if ((0, react_fiber_shell_hydration_1.isRootDehydrated)(root)) {
                // Flush the first scheduled "update".
                var lanes = (0, react_fiber_lane_1.getHighestPriorityPendingLanes)(root);
                (0, react_fiber_work_loop_1.flushRoot)(root, lanes);
            }
            break;
        }
        case work_tags_1.WorkTag.SuspenseComponent: {
            (0, react_fiber_work_flush_sync_1.flushSync)(function () {
                var root = (0, react_fiber_concurrent_updates_1.enqueueConcurrentRenderForLane)(fiber, fiber_lane_constants_1.SyncLane);
                if (root !== null) {
                    (0, react_fiber_work_schedule_update_1.scheduleUpdateOnFiber)(root, fiber, fiber_lane_constants_1.SyncLane);
                }
            });
            // If we're still blocked after this, we need to increase
            // the priority of any promises resolving within this
            // boundary so that they next attempt also has higher pri.
            var retryLane = fiber_lane_constants_1.SyncLane;
            markRetryLaneIfNotHydrated(fiber, retryLane);
            break;
        }
    }
}
exports.attemptSynchronousHydration = attemptSynchronousHydration;
function markRetryLaneImpl(fiber, retryLane) {
    var suspenseState = fiber.memoizedState;
    if (suspenseState !== null && suspenseState.dehydrated !== null) {
        suspenseState.retryLane = (0, react_fiber_lane_1.higherPriorityLane)(suspenseState.retryLane, retryLane);
    }
}
// Increases the priority of thenables when they resolve within this boundary.
function markRetryLaneIfNotHydrated(fiber, retryLane) {
    markRetryLaneImpl(fiber, retryLane);
    var alternate = fiber.alternate;
    if (alternate) {
        markRetryLaneImpl(alternate, retryLane);
    }
}
// This is method comes from binary
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function attemptDiscreteHydration(fiber) {
    throw new Error("Not yet implemented.");
    // if ( fiber.tag !== WorkTag.SuspenseComponent ) {
    //     // We ignore HostRoots here because we can't increase
    //     // their priority and they should not suspend on I/O,
    //     // since you have to wrap anything that might suspend in
    //     // Suspense.
    //     return;
    // }
    //
    // const lane = SyncLane;
    // const root = enqueueConcurrentRenderForLane( fiber, lane );
    //
    // if ( root !== null ) {
    //     var eventTime = requestEventTime();
    //     scheduleUpdateOnFiber( root, fiber, lane, eventTime );
    // }
    //
    // markRetryLaneIfNotHydrated( fiber, lane );
}
exports.attemptDiscreteHydration = attemptDiscreteHydration;
function attemptContinuousHydration(fiber) {
    if (fiber.tag !== work_tags_1.WorkTag.SuspenseComponent) {
        // We ignore HostRoots here because we can't increase
        // their priority and they should not suspend on I/O,
        // since you have to wrap anything that might suspend in
        // Suspense.
        return;
    }
    var lane = fiber_lane_constants_1.SelectiveHydrationLane;
    var root = (0, react_fiber_concurrent_updates_1.enqueueConcurrentRenderForLane)(fiber, lane);
    if (root !== null) {
        (0, react_fiber_work_schedule_update_1.scheduleUpdateOnFiber)(root, fiber, lane);
    }
    markRetryLaneIfNotHydrated(fiber, lane);
}
exports.attemptContinuousHydration = attemptContinuousHydration;
function attemptHydrationAtCurrentPriority(fiber) {
    if (fiber.tag !== work_tags_1.WorkTag.SuspenseComponent) {
        // We ignore HostRoots here because we can't increase
        // their priority other than synchronously flush it.
        return;
    }
    var lane = (0, react_fiber_work_in_progress_request_lane_1.requestUpdateLane)(fiber);
    var root = (0, react_fiber_concurrent_updates_1.enqueueConcurrentRenderForLane)(fiber, lane);
    if (root !== null) {
        (0, react_fiber_work_schedule_update_1.scheduleUpdateOnFiber)(root, fiber, lane);
    }
    markRetryLaneIfNotHydrated(fiber, lane);
}
exports.attemptHydrationAtCurrentPriority = attemptHydrationAtCurrentPriority;
function findHostInstanceWithNoPortals(fiber) {
    var hostFiber = (0, react_fiber_tree_reflection_1.findCurrentHostFiberWithNoPortals)(fiber);
    if (hostFiber === null) {
        return null;
    }
    return getPublicInstance(hostFiber.stateNode);
}
exports.findHostInstanceWithNoPortals = findHostInstanceWithNoPortals;
var overrideHookState = null;
var overrideHookStateDeletePath = null;
var overrideHookStateRenamePath = null;
var overrideProps = null;
var overridePropsDeletePath = null;
var overridePropsRenamePath = null;
var scheduleUpdate = null;
if (__DEV__) {
    var copyWithDeleteImpl_1 = function (obj, path, index) {
        var key = path[index];
        var updated = Array.isArray(obj) ? obj.slice() : __assign({}, obj);
        if (index + 1 === path.length) {
            if (Array.isArray(updated)) {
                updated.splice(key, 1);
            }
            else {
                delete updated[key];
            }
            return updated;
        }
        // $FlowFixMe[incompatible-use] number or string is fine here
        updated[key] = copyWithDeleteImpl_1(obj[key], path, index + 1);
        return updated;
    };
    var copyWithDelete_1 = function (obj, path) {
        return copyWithDeleteImpl_1(obj, path, 0);
    };
    var copyWithRenameImpl_1 = function (obj, oldPath, newPath, index) {
        var oldKey = oldPath[index];
        var updated = Array.isArray(obj) ? obj.slice() : __assign({}, obj);
        if (index + 1 === oldPath.length) {
            var newKey = newPath[index];
            // $FlowFixMe[incompatible-use] number or string is fine here
            updated[newKey] = updated[oldKey];
            if (Array.isArray(updated)) {
                updated.splice(oldKey, 1);
            }
            else {
                delete updated[oldKey];
            }
        }
        else {
            // $FlowFixMe[incompatible-use] number or string is fine here
            updated[oldKey] = copyWithRenameImpl_1(// $FlowFixMe[incompatible-use] number or string is fine here
            obj[oldKey], oldPath, newPath, index + 1);
        }
        return updated;
    };
    var copyWithRename_1 = function (obj, oldPath, newPath) {
        if (oldPath.length !== newPath.length) {
            console.warn("copyWithRename() expects paths of the same length");
            return;
        }
        else {
            for (var i = 0; i < newPath.length - 1; i++) {
                if (oldPath[i] !== newPath[i]) {
                    console.warn("copyWithRename() expects paths to be the same except for the deepest key");
                    return;
                }
            }
        }
        return copyWithRenameImpl_1(obj, oldPath, newPath, 0);
    };
    var copyWithSetImpl_1 = function (obj, path, index, value) {
        if (index >= path.length) {
            return value;
        }
        var key = path[index];
        var updated = Array.isArray(obj) ? obj.slice() : __assign({}, obj);
        // $FlowFixMe[incompatible-use] number or string is fine here
        updated[key] = copyWithSetImpl_1(obj[key], path, index + 1, value);
        return updated;
    };
    var copyWithSet_1 = function (obj, path, value) {
        return copyWithSetImpl_1(obj, path, 0, value);
    };
    var findHook_1 = function (fiber, id) {
        // For now, the "id" of stateful hooks is just the stateful hook index.
        // This may change in the future with e.g. nested hooks.
        var currentHook = fiber.memoizedState;
        while (currentHook !== null && id > 0) {
            currentHook = currentHook.next;
            id--;
        }
        return currentHook;
    };
    // Support DevTools editable values for useState and useReducer.
    overrideHookState = function (fiber, id, path, value) {
        var hook = findHook_1(fiber, id);
        if (hook !== null) {
            var newState = copyWithSet_1(hook.memoizedState, path, value);
            hook.memoizedState = newState;
            hook.baseState = newState;
            // We aren't actually adding an update to the queue,
            // because there is no update we can add for useReducer hooks that won't trigger an error.
            // (There's no appropriate action type for DevTools overrides.)
            // As a result though, React will see the scheduled update as a noop and bailout.
            // Shallow cloning props works as a workaround for now to bypass the bailout check.
            fiber.memoizedProps = __assign({}, fiber.memoizedProps);
            var root = (0, react_fiber_concurrent_updates_1.enqueueConcurrentRenderForLane)(fiber, fiber_lane_constants_1.SyncLane);
            if (root !== null) {
                (0, react_fiber_work_schedule_update_1.scheduleUpdateOnFiber)(root, fiber, fiber_lane_constants_1.SyncLane);
            }
        }
    };
    overrideHookStateDeletePath = function (fiber, id, path) {
        var hook = findHook_1(fiber, id);
        if (hook !== null) {
            var newState = copyWithDelete_1(hook.memoizedState, path);
            hook.memoizedState = newState;
            hook.baseState = newState;
            // We aren't actually adding an update to the queue,
            // because there is no update we can add for useReducer hooks that won't trigger an error.
            // (There's no appropriate action type for DevTools overrides.)
            // As a result though, React will see the scheduled update as a noop and bailout.
            // Shallow cloning props works as a workaround for now to bypass the bailout check.
            fiber.memoizedProps = __assign({}, fiber.memoizedProps);
            var root = (0, react_fiber_concurrent_updates_1.enqueueConcurrentRenderForLane)(fiber, fiber_lane_constants_1.SyncLane);
            if (root !== null) {
                (0, react_fiber_work_schedule_update_1.scheduleUpdateOnFiber)(root, fiber, fiber_lane_constants_1.SyncLane);
            }
        }
    };
    overrideHookStateRenamePath = function (fiber, id, oldPath, newPath) {
        var hook = findHook_1(fiber, id);
        if (hook !== null) {
            var newState = copyWithRename_1(hook.memoizedState, oldPath, newPath);
            hook.memoizedState = newState;
            hook.baseState = newState;
            // We aren't actually adding an update to the queue,
            // because there is no update we can add for useReducer hooks that won't trigger an error.
            // (There's no appropriate action type for DevTools overrides.)
            // As a result though, React will see the scheduled update as a noop and bailout.
            // Shallow cloning props works as a workaround for now to bypass the bailout check.
            fiber.memoizedProps = __assign({}, fiber.memoizedProps);
            var root = (0, react_fiber_concurrent_updates_1.enqueueConcurrentRenderForLane)(fiber, fiber_lane_constants_1.SyncLane);
            if (root !== null) {
                (0, react_fiber_work_schedule_update_1.scheduleUpdateOnFiber)(root, fiber, fiber_lane_constants_1.SyncLane);
            }
        }
    };
    // Support DevTools props for function components, forwardRef, memo, host components, etc.
    overrideProps = function (fiber, path, value) {
        fiber.pendingProps = copyWithSet_1(fiber.memoizedProps, path, value);
        if (fiber.alternate) {
            fiber.alternate.pendingProps = fiber.pendingProps;
        }
        var root = (0, react_fiber_concurrent_updates_1.enqueueConcurrentRenderForLane)(fiber, fiber_lane_constants_1.SyncLane);
        if (root !== null) {
            (0, react_fiber_work_schedule_update_1.scheduleUpdateOnFiber)(root, fiber, fiber_lane_constants_1.SyncLane);
        }
    };
    overridePropsDeletePath = function (fiber, path) {
        fiber.pendingProps = copyWithDelete_1(fiber.memoizedProps, path);
        if (fiber.alternate) {
            fiber.alternate.pendingProps = fiber.pendingProps;
        }
        var root = (0, react_fiber_concurrent_updates_1.enqueueConcurrentRenderForLane)(fiber, fiber_lane_constants_1.SyncLane);
        if (root !== null) {
            (0, react_fiber_work_schedule_update_1.scheduleUpdateOnFiber)(root, fiber, fiber_lane_constants_1.SyncLane);
        }
    };
    overridePropsRenamePath = function (fiber, oldPath, newPath) {
        fiber.pendingProps = copyWithRename_1(fiber.memoizedProps, oldPath, newPath);
        if (fiber.alternate) {
            fiber.alternate.pendingProps = fiber.pendingProps;
        }
        var root = (0, react_fiber_concurrent_updates_1.enqueueConcurrentRenderForLane)(fiber, fiber_lane_constants_1.SyncLane);
        if (root !== null) {
            (0, react_fiber_work_schedule_update_1.scheduleUpdateOnFiber)(root, fiber, fiber_lane_constants_1.SyncLane);
        }
    };
    scheduleUpdate = function (fiber) {
        var root = (0, react_fiber_concurrent_updates_1.enqueueConcurrentRenderForLane)(fiber, fiber_lane_constants_1.SyncLane);
        if (root !== null) {
            (0, react_fiber_work_schedule_update_1.scheduleUpdateOnFiber)(root, fiber, fiber_lane_constants_1.SyncLane);
        }
    };
}
function findHostInstanceByFiber(fiber) {
    var hostFiber = (0, react_fiber_tree_reflection_1.findCurrentHostFiber)(fiber);
    if (hostFiber === null) {
        return null;
    }
    return hostFiber.stateNode;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function emptyFindFiberByHostInstance(instance) {
    return null;
}
function getCurrentFiberForDevTools() {
    return react_current_fiber_1.current;
}
function injectIntoDevTools(devToolsConfig) {
    var findFiberByHostInstance = devToolsConfig.findFiberByHostInstance;
    var ReactCurrentDispatcher = react_shared_internals_1.default.ReactCurrentDispatcher;
    return (0, react_fiber_dev_tools_hook_1.injectInternals)({
        bundleType: devToolsConfig.bundleType,
        version: devToolsConfig.version,
        rendererPackageName: devToolsConfig.rendererPackageName,
        rendererConfig: devToolsConfig.rendererConfig,
        overrideHookState: overrideHookState,
        overrideHookStateDeletePath: overrideHookStateDeletePath,
        overrideHookStateRenamePath: overrideHookStateRenamePath,
        overrideProps: overrideProps,
        overridePropsDeletePath: overridePropsDeletePath,
        overridePropsRenamePath: overridePropsRenamePath,
        setErrorHandler: react_fiber_should_error_1.setShouldError,
        setSuspenseHandler: react_fiber_should_suspend_1.setShouldSuspend,
        scheduleUpdate: scheduleUpdate,
        currentDispatcherRef: ReactCurrentDispatcher,
        findHostInstanceByFiber: findHostInstanceByFiber,
        findFiberByHostInstance: findFiberByHostInstance || emptyFindFiberByHostInstance,
        // React Refresh
        findHostInstancesForRefresh: __DEV__ ? react_fiber_hot_reloading_1.findHostInstancesForRefresh : null,
        scheduleRefresh: __DEV__ ? react_fiber_hot_reloading_1.scheduleRefresh : null,
        scheduleRoot: __DEV__ ? react_fiber_hot_reloading_1.scheduleRoot : null,
        setRefreshHandler: __DEV__ ? react_fiber_hot_reloading_resvole_1.setRefreshHandler : null,
        // Enables DevTools to append owner stacks to error messages in DEV mode.
        getCurrentFiber: __DEV__ ? getCurrentFiberForDevTools : null,
        // Enables DevTools to detect reconciler version rather than renderer version
        // which may not match for third party renderers.
        reconcilerVersion: react_version_1.default
    });
}
exports.injectIntoDevTools = injectIntoDevTools;
