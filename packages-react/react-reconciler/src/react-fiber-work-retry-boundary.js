"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.retryDehydratedSuspenseBoundary = exports.retryTimedOutBoundary = void 0;
var fiber_lane_constants_1 = require("@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants");
var type_of_mode_1 = require("@zenflux/react-shared/src/react-internal-constants/type-of-mode");
var react_fiber_lane_mark_root_1 = require("@zenflux/react-reconciler/src/react-fiber-lane-mark-root");
var react_fiber_root_scheduler_shared_1 = require("@zenflux/react-reconciler/src/react-fiber-root-scheduler-shared");
var react_fiber_concurrent_updates_1 = require("@zenflux/react-reconciler/src/react-fiber-concurrent-updates");
var react_fiber_lane_1 = require("@zenflux/react-reconciler/src/react-fiber-lane");
function requestRetryLane(fiber) {
    // This is a fork of `requestUpdateLane` designed specifically for Suspense
    // "retries" — a special update that attempts to flip a Suspense boundary
    // from its placeholder state to its primary/resolved state.
    // Special cases
    var mode = fiber.mode;
    if ((mode & type_of_mode_1.TypeOfMode.ConcurrentMode) === type_of_mode_1.TypeOfMode.NoMode) {
        return fiber_lane_constants_1.SyncLane;
    }
    return (0, react_fiber_lane_1.claimNextRetryLane)();
}
function retryTimedOutBoundary(boundaryFiber, retryLane) {
    // The boundary fiber (a Suspense component or SuspenseList component)
    // previously was rendered in its fallback state. One of the promises that
    // suspended it has resolved, which means at least part of the tree was
    // likely unblocked. Try rendering again, at a new lanes.
    if (retryLane === fiber_lane_constants_1.NoLane) {
        // TODO: Assign this to `suspenseState.retryLane`? to avoid
        // unnecessary entanglement?
        retryLane = requestRetryLane(boundaryFiber);
    }
    // TODO: Special case idle priority?
    var root = (0, react_fiber_concurrent_updates_1.enqueueConcurrentRenderForLane)(boundaryFiber, retryLane);
    if (root !== null) {
        (0, react_fiber_lane_mark_root_1.markRootUpdated)(root, retryLane);
        react_fiber_root_scheduler_shared_1.ReactFiberRootSchedulerShared.ensureRootScheduled(root);
    }
}
exports.retryTimedOutBoundary = retryTimedOutBoundary;
function retryDehydratedSuspenseBoundary(boundaryFiber) {
    var suspenseState = boundaryFiber.memoizedState;
    var retryLane = fiber_lane_constants_1.NoLane;
    if (suspenseState !== null) {
        retryLane = suspenseState.retryLane;
    }
    retryTimedOutBoundary(boundaryFiber, retryLane);
}
exports.retryDehydratedSuspenseBoundary = retryDehydratedSuspenseBoundary;
