import { isTransitionLane } from "@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants";

import { markRootEntangled } from "@zenflux/react-reconciler/src/react-entangled-lane";
import { intersectLanes, mergeLanes } from "@zenflux/react-reconciler/src/react-fiber-lane";

import type { Lane, FiberRoot, HookUpdateQueue } from "@zenflux/react-shared/src/react-internal-types";

// TODO: Move to ReactFiberConcurrentUpdates?
export function entangleTransitionUpdate<S, A>( root: FiberRoot, queue: HookUpdateQueue<S, A>, lane: Lane ): void {
    if ( isTransitionLane( lane ) ) {
        let queueLanes = queue.lanes;
        // If any entangled lanes are no longer pending on the root, then they
        // must have finished. We can remove them from the shared queue, which
        // represents a superset of the actually pending lanes. In some cases we
        // may entangle more than we need to, but that's OK. In fact it's worse if
        // we *don't* entangle when we should.
        queueLanes = intersectLanes( queueLanes, root.pendingLanes );
        // Entangle the new transition lane with the other transition lanes.
        const newQueueLanes = mergeLanes( queueLanes, lane );
        queue.lanes = newQueueLanes;
        // Even if queue.lanes already include lane, we don't know for certain if
        // the lane finished since the last time we entangled it. So we need to
        // entangle it again, just to be sure.
        markRootEntangled( root, newQueueLanes );
    }
}
