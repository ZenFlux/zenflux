
import { HookFlags } from "@zenflux/react-shared/src/react-internal-constants/hook-flags";
import { FiberFlags } from "@zenflux/react-shared/src/react-internal-constants/fiber-flags";

import { TypeOfMode } from "@zenflux/react-shared/src/react-internal-constants/type-of-mode";

import { ReactFiberHooksCurrent, ReactFiberHooksInfra } from "@zenflux/react-reconciler/src/react-fiber-hooks-shared";

import {
    areHookInputsEqual,
    mountWorkInProgressHook,
    updateWorkInProgressHook
} from "@zenflux/react-reconciler/src/react-fiber-hooks-infra";

import type { EventFunctionPayload } from "@zenflux/react-shared/src/react-internal-types/payload";

import type { DependencyList } from "@zenflux/react-reconciler/src/react-fiber-hooks-types";

import type { Effect, EffectInstance } from "@zenflux/react-shared/src/react-internal-types/effect";

import type { Dispatcher } from "@zenflux/react-shared/src/react-internal-types";

export function createEffectInstance(): EffectInstance {
    return {
        destroy: undefined
    };
}

export function mountEffectImpl( fiberFlags: FiberFlags,
    hookFlags: HookFlags,
    create: Parameters<Dispatcher["useEffect"]>[0],
    deps: DependencyList | undefined | null ): void {
    const hook = mountWorkInProgressHook();
    const nextDeps = deps === undefined ? null : deps;
    ReactFiberHooksCurrent.renderingFiber.flags |= fiberFlags;
    hook.memoizedState = pushEffect( HookFlags.HasEffect | hookFlags, create, createEffectInstance(), nextDeps );
}

export function mountEffect( create: Parameters<Dispatcher["useEffect"]>[0], deps: DependencyList | undefined ): void {
    if (
        __DEV__ &&
        ( ReactFiberHooksCurrent.renderingFiber.mode & TypeOfMode.StrictEffectsMode ) !== TypeOfMode.NoMode &&
        ( ReactFiberHooksCurrent.renderingFiber.mode & TypeOfMode.NoStrictPassiveEffectsMode ) === TypeOfMode.NoMode
    ) {
        mountEffectImpl( FiberFlags.MountPassiveDev | FiberFlags.Passive | FiberFlags.PassiveStatic, HookFlags.Passive, create, deps );
    } else {
        mountEffectImpl( FiberFlags.Passive | FiberFlags.PassiveStatic, HookFlags.Passive, create, deps );
    }
}

export function updateEffect( create: () => ( () => void ) | void, deps: DependencyList | undefined ): void {
    updateEffectImpl( FiberFlags.Passive, HookFlags.Passive, create, deps );
}

export function useEffectEventImpl<Args, Return, F extends ( ... args: Array<Args> ) => Return>( payload: EventFunctionPayload<Args, Return, F> ) {
    ReactFiberHooksCurrent.renderingFiber.flags |= FiberFlags.Update;
    let componentUpdateQueue = ReactFiberHooksCurrent.renderingFiber.updateQueue;

    if ( componentUpdateQueue === null ) {
        componentUpdateQueue = ReactFiberHooksInfra.createFunctionComponentUpdateQueue();
        ReactFiberHooksCurrent.renderingFiber.updateQueue = componentUpdateQueue;
        componentUpdateQueue.events = [ payload ];
    } else {
        const events = componentUpdateQueue.events;

        if ( events === null ) {
            componentUpdateQueue.events = [ payload ];
        } else {
            events.push( payload );
        }
    }
}

export function pushEffect( tag: HookFlags, create: Parameters<Dispatcher["useEffect"]>[0], inst: EffectInstance, deps: DependencyList | null ): Effect {
    const effect: Effect = {
        tag,
        create,
        inst,
        deps,
        // Circular
        next: ( null as any )
    };
    let componentUpdateQueue = ReactFiberHooksCurrent.renderingFiber.updateQueue;

    if ( componentUpdateQueue === null ) {
        componentUpdateQueue = ReactFiberHooksInfra.createFunctionComponentUpdateQueue();
        ReactFiberHooksCurrent.renderingFiber.updateQueue = componentUpdateQueue;
        componentUpdateQueue.lastEffect = effect.next = effect;
    } else {
        const lastEffect = componentUpdateQueue.lastEffect;

        if ( lastEffect === null ) {
            componentUpdateQueue.lastEffect = effect.next = effect;
        } else {
            const firstEffect = lastEffect.next;
            lastEffect.next = effect;
            effect.next = firstEffect;
            componentUpdateQueue.lastEffect = effect;
        }
    }

    return effect;
}

export function updateEffectImpl( fiberFlags: FiberFlags, hookFlags: HookFlags, create: () => ( () => void ) | void, deps: DependencyList | undefined | null ): void {
    const hook = updateWorkInProgressHook();
    const nextDeps = deps === undefined ? null : deps;
    const effect: Effect = hook.memoizedState;
    const inst = effect.inst;

    // ReactFiberHooksCurrent.hook is null on initial mount when rendering after a render phase
    // state update or for strict mode.
    if ( ReactFiberHooksCurrent.hook !== null && nextDeps !== null ) {
        const prevEffect: Effect = ReactFiberHooksCurrent.hook.memoizedState;
        const prevDeps = prevEffect.deps;

        if ( areHookInputsEqual( nextDeps as DependencyList, prevDeps ) ) {
            hook.memoizedState = pushEffect( hookFlags, create, inst, nextDeps );
            return;
        }
    }

    ReactFiberHooksCurrent.renderingFiber.flags |= fiberFlags;
    hook.memoizedState = pushEffect( HookFlags.HasEffect | hookFlags, create, inst, nextDeps );
}
