"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMemo = exports.mountMemo = void 0;
var react_fiber_hooks_infra_1 = require("@zenflux/react-reconciler/src/react-fiber-hooks-infra");
var react_fiber_hooks_shared_1 = require("@zenflux/react-reconciler/src/react-fiber-hooks-shared");
function mountMemo(nextCreate, deps) {
    var hook = (0, react_fiber_hooks_infra_1.mountWorkInProgressHook)();
    var nextDeps = deps === undefined ? null : deps;
    if (react_fiber_hooks_shared_1.ReactFiberHooksInfra.shouldDoubleInvokeUserFnsInHooksDEV) {
        nextCreate();
    }
    var nextValue = nextCreate();
    hook.memoizedState = [nextValue, nextDeps];
    return nextValue;
}
exports.mountMemo = mountMemo;
;
function updateMemo(nextCreate, deps) {
    var hook = (0, react_fiber_hooks_infra_1.updateWorkInProgressHook)();
    var nextDeps = deps === undefined ? null : deps;
    var prevState = hook.memoizedState;
    // Assume these are defined. If they're not, areHookInputsEqual will warn.
    if (nextDeps !== null) {
        var prevDeps = prevState[1];
        if ((0, react_fiber_hooks_infra_1.areHookInputsEqual)(nextDeps, prevDeps)) {
            return prevState[0];
        }
    }
    if (react_fiber_hooks_shared_1.ReactFiberHooksInfra.shouldDoubleInvokeUserFnsInHooksDEV) {
        nextCreate();
    }
    var nextValue = nextCreate();
    hook.memoizedState = [nextValue, nextDeps];
    return nextValue;
}
exports.updateMemo = updateMemo;
