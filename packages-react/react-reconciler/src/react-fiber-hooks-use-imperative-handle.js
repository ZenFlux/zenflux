"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateImperativeHandle = exports.mountImperativeHandle = void 0;
var type_of_mode_1 = require("@zenflux/react-shared/src/react-internal-constants/type-of-mode");
var hook_flags_1 = require("@zenflux/react-shared/src/react-internal-constants/hook-flags");
var fiber_flags_1 = require("@zenflux/react-shared/src/react-internal-constants/fiber-flags");
var react_fiber_hooks_shared_1 = require("@zenflux/react-reconciler/src/react-fiber-hooks-shared");
var react_fiber_hooks_use_effect_1 = require("@zenflux/react-reconciler/src/react-fiber-hooks-use-effect");
function imperativeHandleEffect(create, ref) {
    if (typeof ref === "function") {
        var refCallback_1 = ref;
        var inst = create();
        refCallback_1(inst);
        return function () {
            refCallback_1(null);
        };
    }
    else if (ref !== null && ref !== undefined) {
        var refObject_1 = ref;
        if (__DEV__) {
            if (!refObject_1.hasOwnProperty("current")) {
                console.error("Expected useImperativeHandle() first argument to either be a " + "ref callback or React.createRef() object. Instead received: %s.", "an object with keys {" + Object.keys(refObject_1).join(", ") + "}");
            }
        }
        var inst = create();
        // TODO: React types protect current as readonly, but imperativelyHandle needs to
        // @ts-ignore
        refObject_1["current"] = inst;
        return function () {
            // @ts-ignore
            refObject_1["current"] = null;
        };
    }
}
function mountImperativeHandle(ref, create, deps) {
    if (__DEV__) {
        if (typeof create !== "function") {
            console.error("Expected useImperativeHandle() second argument to be a function " + "that creates a handle. Instead received: %s.", create !== null ? typeof create : "null");
        }
    }
    // TODO: If deps are provided, should we skip comparing the ref itself?
    var effectDeps = deps !== null && deps !== undefined ? deps.concat([ref]) : null;
    var fiberFlags = fiber_flags_1.FiberFlags.Update | fiber_flags_1.FiberFlags.LayoutStatic;
    if (__DEV__ && (react_fiber_hooks_shared_1.ReactFiberHooksCurrent.renderingFiber.mode & type_of_mode_1.TypeOfMode.StrictEffectsMode) !== type_of_mode_1.TypeOfMode.NoMode) {
        fiberFlags |= fiber_flags_1.FiberFlags.MountLayoutDev;
    }
    (0, react_fiber_hooks_use_effect_1.mountEffectImpl)(fiberFlags, hook_flags_1.HookFlags.Layout, imperativeHandleEffect.bind(null, create, ref), effectDeps);
}
exports.mountImperativeHandle = mountImperativeHandle;
function updateImperativeHandle(ref, create, deps) {
    if (__DEV__) {
        if (typeof create !== "function") {
            console.error("Expected useImperativeHandle() second argument to be a function " + "that creates a handle. Instead received: %s.", create !== null ? typeof create : "null");
        }
    }
    // TODO: If deps are provided, should we skip comparing the ref itself?
    var effectDeps = deps !== null && deps !== undefined ? deps.concat([ref]) : null;
    (0, react_fiber_hooks_use_effect_1.updateEffectImpl)(fiber_flags_1.FiberFlags.Update, hook_flags_1.HookFlags.Layout, imperativeHandleEffect.bind(null, create, ref), effectDeps);
}
exports.updateImperativeHandle = updateImperativeHandle;
