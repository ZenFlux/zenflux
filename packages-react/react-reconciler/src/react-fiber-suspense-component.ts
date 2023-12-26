import { FiberFlags } from "@zenflux/react-shared/src/react-internal-constants/fiber-flags";
import { WorkTag } from "@zenflux/react-shared/src/react-internal-constants/work-tags";

import type { SuspenseInstance } from "@zenflux/react-shared/src/react-internal-types/suspense";

import type { TreeContext } from "@zenflux/react-reconciler/src/react-fiber-tree-context";
import type { ReactNodeList, Wakeable } from "@zenflux/react-shared/src/react-types";
import type { Fiber, Lane } from "@zenflux/react-shared/src/react-internal-types";

const {
    isSuspenseInstancePending,
    isSuspenseInstanceFallback
} = globalThis.__RECONCILER__CONFIG__;

export type SuspenseProps = {
    children?: ReactNodeList;
    fallback?: ReactNodeList;
    // TODO: Add "unstable_" prefix?
    suspenseCallback?: ( arg0: Set<Wakeable> | null ) => unknown;
    unstable_avoidThisFallback?: boolean;
    unstable_expectedLoadTime?: number;
    unstable_name?: string;
};
// A null SuspenseState represents an unsuspended normal Suspense boundary.
// A non-null SuspenseState means that it is blocked for one reason or another.
// - A non-null dehydrated field means it's blocked pending hydration.
//   - A non-null dehydrated field can use isSuspenseInstancePending or
//     isSuspenseInstanceFallback to query the reason for being dehydrated.
// - A null dehydrated field means it's blocked by something suspending and
//   we're currently showing a fallback instead.
export type SuspenseState = {
    // If this boundary is still dehydrated, we store the SuspenseInstance
    // here to indicate that it is dehydrated (flag) and for quick access
    // to check things like isSuspenseInstancePending.
    dehydrated: null | SuspenseInstance;
    treeContext: null | TreeContext;
    // Represents the lane we should attempt to hydrate a dehydrated boundary at.
    // OffscreenLane is the default for dehydrated boundaries.
    // NoLane is the default for normal boundaries, which turns into "normal" pri.
    retryLane: Lane;
};
export type SuspenseListTailMode = "collapsed" | "hidden";
export type SuspenseListRenderState = {
    isBackwards: boolean;
    // The currently rendering tail row.
    rendering: null | Fiber;
    // The absolute time when we started rendering the most recent tail row.
    renderingStartTime: number;
    // The last of the already rendered children.
    last: null | Fiber;
    // Remaining rows on the tail of the list.
    tail: null | Fiber;
    // Tail insertions setting.
    tailMode: SuspenseListTailMode | undefined;
};

export function findFirstSuspended( row: Fiber ): null | Fiber {
    let node = row;

    while ( node !== null ) {
        if ( node.tag === WorkTag.SuspenseComponent ) {
            const state: SuspenseState | null = node.memoizedState;

            if ( state !== null ) {
                const dehydrated: null | SuspenseInstance = state.dehydrated;

                if ( dehydrated === null || isSuspenseInstancePending( dehydrated ) || isSuspenseInstanceFallback( dehydrated ) ) {
                    return node;
                }
            }
        } else if ( node.tag === WorkTag.SuspenseListComponent && // revealOrder undefined can't be trusted because it don't
            // keep track of whether it suspended or not.
            node.memoizedProps.revealOrder !== undefined ) {
            const didSuspend = ( node.flags & FiberFlags.DidCapture ) !== FiberFlags.NoFlags;

            if ( didSuspend ) {
                return node;
            }
        } else if ( node.child !== null ) {
            node.child.return = node;
            node = node.child;
            continue;
        }

        if ( node === row ) {
            return null;
        }

        while ( node.sibling === null ) {
            if ( node.return === null || node.return === row ) {
                return null;
            }

            node = node.return;
        }

        node.sibling.return = node.return;
        node = node.sibling;
    }

    return null;
}
