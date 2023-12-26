import type { Fiber } from "@zenflux/react-shared/src/react-internal-types";

export function isOffscreenManual( offscreenFiber: Fiber ): boolean {
    return offscreenFiber.memoizedProps !== null && offscreenFiber.memoizedProps.mode === "manual";
}
