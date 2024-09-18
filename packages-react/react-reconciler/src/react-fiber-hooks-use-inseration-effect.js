"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateInsertionEffect = exports.mountInsertionEffect = void 0;
var hook_flags_1 = require("@zenflux/react-shared/src/react-internal-constants/hook-flags");
var fiber_flags_1 = require("@zenflux/react-shared/src/react-internal-constants/fiber-flags");
var react_fiber_hooks_use_effect_1 = require("@zenflux/react-reconciler/src/react-fiber-hooks-use-effect");
function mountInsertionEffect(create, deps) {
    (0, react_fiber_hooks_use_effect_1.mountEffectImpl)(fiber_flags_1.FiberFlags.Update, hook_flags_1.HookFlags.Insertion, create, deps);
}
exports.mountInsertionEffect = mountInsertionEffect;
function updateInsertionEffect(create, deps) {
    return (0, react_fiber_hooks_use_effect_1.updateEffectImpl)(fiber_flags_1.FiberFlags.Update, hook_flags_1.HookFlags.Insertion, create, deps);
}
exports.updateInsertionEffect = updateInsertionEffect;
