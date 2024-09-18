"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateLayoutEffect = exports.mountLayoutEffect = void 0;
var fiber_flags_1 = require("@zenflux/react-shared/src/react-internal-constants/fiber-flags");
var hook_flags_1 = require("@zenflux/react-shared/src/react-internal-constants/hook-flags");
var type_of_mode_1 = require("@zenflux/react-shared/src/react-internal-constants/type-of-mode");
var react_fiber_hooks_shared_1 = require("@zenflux/react-reconciler/src/react-fiber-hooks-shared");
var react_fiber_hooks_use_effect_1 = require("@zenflux/react-reconciler/src/react-fiber-hooks-use-effect");
function mountLayoutEffect(create, deps) {
    var fiberFlags = fiber_flags_1.FiberFlags.Update | fiber_flags_1.FiberFlags.LayoutStatic;
    if (__DEV__ && (react_fiber_hooks_shared_1.ReactFiberHooksCurrent.renderingFiber.mode & type_of_mode_1.TypeOfMode.StrictEffectsMode) !== type_of_mode_1.TypeOfMode.NoMode) {
        fiberFlags |= fiber_flags_1.FiberFlags.MountLayoutDev;
    }
    return (0, react_fiber_hooks_use_effect_1.mountEffectImpl)(fiberFlags, hook_flags_1.HookFlags.Layout, create, deps);
}
exports.mountLayoutEffect = mountLayoutEffect;
function updateLayoutEffect(create, deps) {
    return (0, react_fiber_hooks_use_effect_1.updateEffectImpl)(fiber_flags_1.FiberFlags.Update, hook_flags_1.HookFlags.Layout, create, deps);
}
exports.updateLayoutEffect = updateLayoutEffect;
