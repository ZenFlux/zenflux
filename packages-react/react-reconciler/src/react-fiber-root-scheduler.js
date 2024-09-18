"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestTransitionLane = void 0;
var fiber_lane_constants_1 = require("@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants");
var react_fiber_root_scheduler_shared_1 = require("@zenflux/react-reconciler/src/react-fiber-root-scheduler-shared");
var react_fiber_lane_1 = require("@zenflux/react-reconciler/src/react-fiber-lane");
function requestTransitionLane() {
    // The algorithm for assigning an update to a lane should be stable for all
    // updates at the same priority within the same event. To do this, the
    // inputs to the algorithm must be the same.
    //
    // The trick we use is to cache the first of each of these inputs within an
    // event. Then reset the cached values once we can be sure the event is
    // over. Our heuristic for that is whenever we enter a concurrent work loop.
    if (react_fiber_root_scheduler_shared_1.ReactFiberRootSchedulerShared.currentEventTransitionLane === fiber_lane_constants_1.NoLane) {
        // All transitions within the same event are assigned the same lane.
        react_fiber_root_scheduler_shared_1.ReactFiberRootSchedulerShared.currentEventTransitionLane = (0, react_fiber_lane_1.claimNextTransitionLane)();
    }
    return react_fiber_root_scheduler_shared_1.ReactFiberRootSchedulerShared.currentEventTransitionLane;
}
exports.requestTransitionLane = requestTransitionLane;
