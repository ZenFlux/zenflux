import { FiberFlags } from "@zenflux/react-shared/src/react-internal-constants/fiber-flags";
import { HookFlags } from "@zenflux/react-shared/src/react-internal-constants/hook-flags";
import { TypeOfMode } from "@zenflux/react-shared/src/react-internal-constants/type-of-mode";

import { ReactFiberHooksCurrent } from "@zenflux/react-reconciler/src/react-fiber-hooks-shared";

import { mountEffectImpl, updateEffectImpl } from "@zenflux/react-reconciler/src/react-fiber-hooks-use-effect";

import type { DependencyList } from "@zenflux/react-reconciler/src/react-fiber-hooks-types";

export function mountLayoutEffect( create: () => ( () => void ) | void, deps: DependencyList | undefined ): void {
    let fiberFlags: FiberFlags = FiberFlags.Update | FiberFlags.LayoutStatic;

    if ( __DEV__ && ( ReactFiberHooksCurrent.renderingFiber.mode & TypeOfMode.StrictEffectsMode ) !== TypeOfMode.NoMode ) {
        fiberFlags |= FiberFlags.MountLayoutDev;
    }

    return mountEffectImpl( fiberFlags, HookFlags.Layout, create, deps );
}

export function updateLayoutEffect( create: () => ( () => void ) | void, deps: DependencyList | undefined ): void {
    return updateEffectImpl( FiberFlags.Update, HookFlags.Layout, create, deps );
}
