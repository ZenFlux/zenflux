import type { FiberRoot } from "@zenflux/react-shared/src/react-internal-types";
import type { RootState } from "@zenflux/react-reconciler/src/react-fiber-root";

// This is imported by the event replaying implementation in React DOM. It's
// in a separate file to break a circular dependency between the renderer and
// the reconciler.
export function isRootDehydrated( root: FiberRoot ): boolean {
    const currentState: RootState = root.current.memoizedState;
    return currentState.isDehydrated;
}
