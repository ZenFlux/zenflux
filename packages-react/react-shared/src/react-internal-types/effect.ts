
import type { DependencyList } from "react";

import type { Dispatcher } from "@zenflux/react-shared/src/react-internal-types/dispatcher";

import type { HookFlags } from "@zenflux/react-shared/src/react-internal-constants/hook-flags";

// The effect "instance" is a shared object that remains the same for the entire
// lifetime of an effect. In Rust terms, a RefCell. We use it to store the
// "destroy" function that is returned from an effect, because that is stateful.
// The field is `undefined` if the effect is unmounted, or if the effect ran
// but is not stateful. We don't explicitly track whether the effect is mounted
// or unmounted because that can be inferred by the hiddenness of the fiber in
// the tree, i.e. whether there is a hidden Offscreen fiber above it.
//
// It's unfortunate that this is stored on a separate object, because it adds
// more memory per effect instance, but it's conceptually sound. I think there's
// likely a better data structure we could use for effects; perhaps just one
// array of effect instances per fiber. But I think this is OK for now despite
// the additional memory and we can follow up with performance
// optimizations later.
export type EffectInstance = {
    destroy: ReturnType<Parameters<Dispatcher[ "useEffect" ]>[ 0 ]>
};

export type Effect = {
    tag: HookFlags;
    create: Parameters<Dispatcher[ "useEffect" ]>[ 0 ]
    inst: EffectInstance;
    deps: DependencyList | null;
    next: Effect;
};
