"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateEffectImpl = exports.pushEffect = exports.useEffectEventImpl = exports.updateEffect = exports.mountEffect = exports.mountEffectImpl = exports.createEffectInstance = void 0;
var hook_flags_1 = require("@zenflux/react-shared/src/react-internal-constants/hook-flags");
var fiber_flags_1 = require("@zenflux/react-shared/src/react-internal-constants/fiber-flags");
var type_of_mode_1 = require("@zenflux/react-shared/src/react-internal-constants/type-of-mode");
var react_fiber_hooks_shared_1 = require("@zenflux/react-reconciler/src/react-fiber-hooks-shared");
var react_fiber_hooks_infra_1 = require("@zenflux/react-reconciler/src/react-fiber-hooks-infra");
function createEffectInstance() {
    return {
        destroy: undefined
    };
}
exports.createEffectInstance = createEffectInstance;
function mountEffectImpl(fiberFlags, hookFlags, create, deps) {
    var hook = (0, react_fiber_hooks_infra_1.mountWorkInProgressHook)();
    var nextDeps = deps === undefined ? null : deps;
    react_fiber_hooks_shared_1.ReactFiberHooksCurrent.renderingFiber.flags |= fiberFlags;
    hook.memoizedState = pushEffect(hook_flags_1.HookFlags.HasEffect | hookFlags, create, createEffectInstance(), nextDeps);
}
exports.mountEffectImpl = mountEffectImpl;
function mountEffect(create, deps) {
    if (__DEV__ &&
        (react_fiber_hooks_shared_1.ReactFiberHooksCurrent.renderingFiber.mode & type_of_mode_1.TypeOfMode.StrictEffectsMode) !== type_of_mode_1.TypeOfMode.NoMode &&
        (react_fiber_hooks_shared_1.ReactFiberHooksCurrent.renderingFiber.mode & type_of_mode_1.TypeOfMode.NoStrictPassiveEffectsMode) === type_of_mode_1.TypeOfMode.NoMode) {
        mountEffectImpl(fiber_flags_1.FiberFlags.MountPassiveDev | fiber_flags_1.FiberFlags.Passive | fiber_flags_1.FiberFlags.PassiveStatic, hook_flags_1.HookFlags.Passive, create, deps);
    }
    else {
        mountEffectImpl(fiber_flags_1.FiberFlags.Passive | fiber_flags_1.FiberFlags.PassiveStatic, hook_flags_1.HookFlags.Passive, create, deps);
    }
}
exports.mountEffect = mountEffect;
function updateEffect(create, deps) {
    updateEffectImpl(fiber_flags_1.FiberFlags.Passive, hook_flags_1.HookFlags.Passive, create, deps);
}
exports.updateEffect = updateEffect;
function useEffectEventImpl(payload) {
    react_fiber_hooks_shared_1.ReactFiberHooksCurrent.renderingFiber.flags |= fiber_flags_1.FiberFlags.Update;
    var componentUpdateQueue = react_fiber_hooks_shared_1.ReactFiberHooksCurrent.renderingFiber.updateQueue;
    if (componentUpdateQueue === null) {
        componentUpdateQueue = react_fiber_hooks_shared_1.ReactFiberHooksInfra.createFunctionComponentUpdateQueue();
        react_fiber_hooks_shared_1.ReactFiberHooksCurrent.renderingFiber.updateQueue = componentUpdateQueue;
        componentUpdateQueue.events = [payload];
    }
    else {
        var events = componentUpdateQueue.events;
        if (events === null) {
            componentUpdateQueue.events = [payload];
        }
        else {
            events.push(payload);
        }
    }
}
exports.useEffectEventImpl = useEffectEventImpl;
function pushEffect(tag, create, inst, deps) {
    var effect = {
        tag: tag,
        create: create,
        inst: inst,
        deps: deps,
        // Circular
        next: null
    };
    var componentUpdateQueue = react_fiber_hooks_shared_1.ReactFiberHooksCurrent.renderingFiber.updateQueue;
    if (componentUpdateQueue === null) {
        componentUpdateQueue = react_fiber_hooks_shared_1.ReactFiberHooksInfra.createFunctionComponentUpdateQueue();
        react_fiber_hooks_shared_1.ReactFiberHooksCurrent.renderingFiber.updateQueue = componentUpdateQueue;
        componentUpdateQueue.lastEffect = effect.next = effect;
    }
    else {
        var lastEffect = componentUpdateQueue.lastEffect;
        if (lastEffect === null) {
            componentUpdateQueue.lastEffect = effect.next = effect;
        }
        else {
            var firstEffect = lastEffect.next;
            lastEffect.next = effect;
            effect.next = firstEffect;
            componentUpdateQueue.lastEffect = effect;
        }
    }
    return effect;
}
exports.pushEffect = pushEffect;
function updateEffectImpl(fiberFlags, hookFlags, create, deps) {
    var hook = (0, react_fiber_hooks_infra_1.updateWorkInProgressHook)();
    var nextDeps = deps === undefined ? null : deps;
    var effect = hook.memoizedState;
    var inst = effect.inst;
    // ReactFiberHooksCurrent.hook is null on initial mount when rendering after a render phase
    // state update or for strict mode.
    if (react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hook !== null && nextDeps !== null) {
        var prevEffect = react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hook.memoizedState;
        var prevDeps = prevEffect.deps;
        if ((0, react_fiber_hooks_infra_1.areHookInputsEqual)(nextDeps, prevDeps)) {
            hook.memoizedState = pushEffect(hookFlags, create, inst, nextDeps);
            return;
        }
    }
    react_fiber_hooks_shared_1.ReactFiberHooksCurrent.renderingFiber.flags |= fiberFlags;
    hook.memoizedState = pushEffect(hook_flags_1.HookFlags.HasEffect | hookFlags, create, inst, nextDeps);
}
exports.updateEffectImpl = updateEffectImpl;
