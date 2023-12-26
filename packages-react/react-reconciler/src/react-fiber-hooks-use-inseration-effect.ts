import { HookFlags } from "@zenflux/react-shared/src/react-internal-constants/hook-flags";
import { FiberFlags } from "@zenflux/react-shared/src/react-internal-constants/fiber-flags";

import { mountEffectImpl, updateEffectImpl } from "@zenflux/react-reconciler/src/react-fiber-hooks-use-effect";

import type { DependencyList } from "@zenflux/react-reconciler/src/react-fiber-hooks-types";

export function mountInsertionEffect( create: () => ( () => void ) | void, deps: DependencyList | undefined ): void {
    mountEffectImpl( FiberFlags.Update, HookFlags.Insertion, create, deps );
}

export function updateInsertionEffect( create: () => ( () => void ) | void, deps: DependencyList | undefined ): void {
    return updateEffectImpl( FiberFlags.Update, HookFlags.Insertion, create, deps );
}
