"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateId = exports.mountId = void 0;
var react_fiber_work_in_progress_1 = require("@zenflux/react-reconciler/src/react-fiber-work-in-progress");
var react_fiber_hydration_is_hydrating_1 = require("@zenflux/react-reconciler/src/react-fiber-hydration-is-hydrating");
var react_fiber_tree_context_1 = require("@zenflux/react-reconciler/src/react-fiber-tree-context");
var react_fiber_hooks_shared_1 = require("@zenflux/react-reconciler/src/react-fiber-hooks-shared");
var react_fiber_hooks_infra_1 = require("@zenflux/react-reconciler/src/react-fiber-hooks-infra");
function mountId() {
    var hook = (0, react_fiber_hooks_infra_1.mountWorkInProgressHook)();
    var root = (0, react_fiber_work_in_progress_1.getWorkInProgressRoot)();
    // TODO: In Fizz, id generation is specific to each server config. Maybe we
    // should do this in Fiber, too? Deferring this decision for now because
    // there's no other place to store the prefix except for an internal field on
    // the public createRoot object, which the fiber tree does not currently have
    // a reference to.
    var identifierPrefix = root.identifierPrefix;
    var id;
    if ((0, react_fiber_hydration_is_hydrating_1.isHydrating)()) {
        var treeId = (0, react_fiber_tree_context_1.getTreeId)();
        // Use a captial R prefix for server-generated ids.
        id = ":" + identifierPrefix + "R" + treeId;
        // Unless this is the first id at this level, append a number at the end
        // that represents the position of this useId hook among all the useId
        // hooks for this fiber.
        var localId = react_fiber_hooks_shared_1.ReactFiberHooksCurrent.localIdCounter++;
        if (localId > 0) {
            id += "H" + localId.toString(32);
        }
        id += ":";
    }
    else {
        // Use a lowercase r prefix for client-generated ids.
        var globalClientId = react_fiber_hooks_shared_1.ReactFiberHooksGlobals.clientIdCounter++;
        id = ":" + identifierPrefix + "r" + globalClientId.toString(32) + ":";
    }
    hook.memoizedState = id;
    return id;
}
exports.mountId = mountId;
function updateId() {
    var hook = (0, react_fiber_hooks_infra_1.updateWorkInProgressHook)();
    var id = hook.memoizedState;
    return id;
}
exports.updateId = updateId;
