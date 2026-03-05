import type { Fiber } from "@zenflux/react-shared/src/react-internal-types/index";

export function isOffscreenManual( offscreenFiber: Fiber ): boolean {
    return offscreenFiber.memoizedProps !== null && offscreenFiber.memoizedProps.mode === "manual";
}
