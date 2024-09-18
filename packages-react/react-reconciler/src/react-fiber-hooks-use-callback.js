"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCallback = exports.mountCallback = void 0;
var react_fiber_hooks_infra_1 = require("@zenflux/react-reconciler/src/react-fiber-hooks-infra");
function mountCallback(callback, deps) {
    var hook = (0, react_fiber_hooks_infra_1.mountWorkInProgressHook)();
    var nextDeps = deps === undefined ? null : deps;
    hook.memoizedState = [callback, nextDeps];
    return callback;
}
exports.mountCallback = mountCallback;
function updateCallback(callback, deps) {
    var hook = (0, react_fiber_hooks_infra_1.updateWorkInProgressHook)();
    var nextDeps = deps === undefined ? null : deps;
    var prevState = hook.memoizedState;
    if (nextDeps !== null) {
        var prevDeps = prevState[1];
        if ((0, react_fiber_hooks_infra_1.areHookInputsEqual)(nextDeps, prevDeps)) {
            return prevState[0];
        }
    }
    hook.memoizedState = [callback, nextDeps];
    return callback;
}
exports.updateCallback = updateCallback;
