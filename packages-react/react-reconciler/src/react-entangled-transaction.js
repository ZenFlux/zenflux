"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.entangleTransitionUpdate = void 0;
var fiber_lane_constants_1 = require("@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants");
var react_entangled_lane_1 = require("@zenflux/react-reconciler/src/react-entangled-lane");
var react_fiber_lane_1 = require("@zenflux/react-reconciler/src/react-fiber-lane");
// TODO: Move to ReactFiberConcurrentUpdates?
function entangleTransitionUpdate(root, queue, lane) {
    if ((0, fiber_lane_constants_1.isTransitionLane)(lane)) {
        var queueLanes = queue.lanes;
        // If any entangled lanes are no longer pending on the root, then they
        // must have finished. We can remove them from the shared queue, which
        // represents a superset of the actually pending lanes. In some cases we
        // may entangle more than we need to, but that's OK. In fact it's worse if
        // we *don't* entangle when we should.
        queueLanes = (0, react_fiber_lane_1.intersectLanes)(queueLanes, root.pendingLanes);
        // Entangle the new transition lane with the other transition lanes.
        var newQueueLanes = (0, react_fiber_lane_1.mergeLanes)(queueLanes, lane);
        queue.lanes = newQueueLanes;
        // Even if queue.lanes already include lane, we don't know for certain if
        // the lane finished since the last time we entangled it. So we need to
        // entangle it again, just to be sure.
        (0, react_entangled_lane_1.markRootEntangled)(root, newQueueLanes);
    }
}
exports.entangleTransitionUpdate = entangleTransitionUpdate;
