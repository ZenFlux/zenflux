import { NoLane } from "@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants";

import { ReactFiberRootSchedulerShared } from "@zenflux/react-reconciler/src/react-fiber-root-scheduler-shared";
import { claimNextTransitionLane } from "@zenflux/react-reconciler/src/react-fiber-lane";

import type { Lane } from "@zenflux/react-shared/src/react-internal-types";

export function requestTransitionLane(): Lane {
    // The algorithm for assigning an update to a lane should be stable for all
    // updates at the same priority within the same event. To do this, the
    // inputs to the algorithm must be the same.
    //
    // The trick we use is to cache the first of each of these inputs within an
    // event. Then reset the cached values once we can be sure the event is
    // over. Our heuristic for that is whenever we enter a concurrent work loop.
    if ( ReactFiberRootSchedulerShared.currentEventTransitionLane === NoLane ) {
        // All transitions within the same event are assigned the same lane.
        ReactFiberRootSchedulerShared.currentEventTransitionLane = claimNextTransitionLane();
    }

    return ReactFiberRootSchedulerShared.currentEventTransitionLane;
}
