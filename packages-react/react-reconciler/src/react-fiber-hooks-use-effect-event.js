"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateEvent = exports.mountEvent = void 0;
var react_fiber_hooks_infra_1 = require("@zenflux/react-reconciler/src/react-fiber-hooks-infra");
var react_fiber_work_excution_context_1 = require("@zenflux/react-reconciler/src/react-fiber-work-excution-context");
var react_fiber_hooks_use_effect_1 = require("@zenflux/react-reconciler/src/react-fiber-hooks-use-effect");
function isInvalidExecutionContextForEventFunction() {
    // Used to throw if certain APIs are called from the wrong context.
    return (0, react_fiber_work_excution_context_1.isExecutionContextRenderDeactivate)();
}
function mountEvent(callback) {
    var hook = (0, react_fiber_hooks_infra_1.mountWorkInProgressHook)();
    var ref = {
        impl: callback
    };
    hook.memoizedState = ref;
    // $FlowIgnore[incompatible-return]
    return function eventFn() {
        if (isInvalidExecutionContextForEventFunction()) {
            throw new Error("A function wrapped in useEffectEvent can't be called during rendering.");
        }
        return ref.impl.apply(undefined, arguments);
    };
}
exports.mountEvent = mountEvent;
function updateEvent(callback) {
    var hook = (0, react_fiber_hooks_infra_1.updateWorkInProgressHook)();
    var ref = hook.memoizedState;
    (0, react_fiber_hooks_use_effect_1.useEffectEventImpl)({
        ref: ref,
        nextImpl: callback
    });
    // $FlowIgnore[incompatible-return]
    return function eventFn() {
        if (isInvalidExecutionContextForEventFunction()) {
            throw new Error("A function wrapped in useEffectEvent can't be called during rendering.");
        }
        return ref.impl.apply(undefined, arguments);
    };
}
exports.updateEvent = updateEvent;
