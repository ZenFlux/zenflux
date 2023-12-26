// The deepest Fiber on the stack involved in a hydration context.
// This may have been an insertion or a hydration.
import type { Fiber } from "@zenflux/react-shared/src/react-internal-types";

let hydrationParentFiber: null | Fiber = null;

export function setHydrationParentFiber( fiber: Fiber | null ) {
    hydrationParentFiber = fiber;
}

export function getHydrationParentFiber() {
    return hydrationParentFiber;
}

export function getHydrationParentFiberSafe() {
    return hydrationParentFiber!;
}

export function clearHydrationParentFiber() {
    hydrationParentFiber = null;
}

export function hasHydrationParentFiber() {
    return !! hydrationParentFiber;
}
