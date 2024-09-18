"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markRootFinished = exports.markRootPinged = exports.markRootSuspendedInternal = exports.markRootSuspended = exports.markRootUpdated = void 0;
var fiber_lane_constants_1 = require("@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants");
var react_fiber_work_in_progress_1 = require("@zenflux/react-reconciler/src/react-fiber-work-in-progress");
var react_fiber_lane_1 = require("@zenflux/react-reconciler/src/react-fiber-lane");
function markSpawnedDeferredLane(root, spawnedLane, entangledLanes) {
    // This render spawned a deferred task. Mark it as pending.
    root.pendingLanes |= spawnedLane;
    root.suspendedLanes &= ~spawnedLane;
    // Entangle the spawned lane with the DeferredLane bit so that we know it
    // was the result of another render. This lets us avoid a useDeferredValue
    // waterfall — only the first level will defer.
    var spawnedLaneIndex = (0, react_fiber_lane_1.pickArbitraryLaneIndex)(spawnedLane);
    root.entangledLanes |= spawnedLane;
    root.entanglements[spawnedLaneIndex] |= fiber_lane_constants_1.DeferredLane | // If the parent render task suspended, we must also entangle those lanes
        // with the spawned task, so that the deferred task includes all the same
        // updates that the parent task did. We can exclude any lane that is not
        // used for updates (e.g. Offscreen).
        entangledLanes & fiber_lane_constants_1.UpdateLanes;
}
function markRootUpdated(root, updateLane) {
    root.pendingLanes |= updateLane;
    // If there are any suspended transitions, it's possible this new update
    // could unblock them. Clear the suspended lanes so that we can try rendering
    // them again.
    //
    // TODO: We really only need to unsuspend only lanes that are in the
    // `subtreeLanes` of the updated fiber, or the update lanes of the return
    // path. This would exclude suspended updates in an unrelated sibling tree,
    // since there's no way for this update to unblock it.
    //
    // We don't do this if the incoming update is idle, because we never process
    // idle updates until after all the regular updates have finished; there's no
    // way it could unblock a transition.
    if (updateLane !== fiber_lane_constants_1.IdleLane) {
        root.suspendedLanes = fiber_lane_constants_1.NoLanes;
        root.pingedLanes = fiber_lane_constants_1.NoLanes;
    }
}
exports.markRootUpdated = markRootUpdated;
function markRootSuspended(root, suspendedLanes, spawnedLane) {
    // When suspending, we should always exclude lanes that were pinged or (more
    // rarely, since we try to avoid it) updated during the render phase.
    // TODO: Lol maybe there's a better way to factor this besides this
    // obnoxiously named function :)
    suspendedLanes = (0, react_fiber_lane_1.removeLanes)(suspendedLanes, (0, react_fiber_work_in_progress_1.getWorkInProgressRootPingedLanes)());
    suspendedLanes = (0, react_fiber_lane_1.removeLanes)(suspendedLanes, (0, react_fiber_work_in_progress_1.getWorkInProgressRootInterleavedUpdatedLanes)());
    markRootSuspendedInternal(root, suspendedLanes, spawnedLane);
}
exports.markRootSuspended = markRootSuspended;
function markRootSuspendedInternal(root, suspendedLanes, spawnedLane) {
    root.suspendedLanes |= suspendedLanes;
    root.pingedLanes &= ~suspendedLanes;
    // The suspended lanes are no longer CPU-bound. Clear their expiration times.
    var expirationTimes = root.expirationTimes;
    var lanes = suspendedLanes;
    while (lanes > 0) {
        var index = (0, react_fiber_lane_1.pickArbitraryLaneIndex)(lanes);
        var lane = 1 << index;
        expirationTimes[index] = react_fiber_lane_1.NoTimestamp;
        lanes &= ~lane;
    }
    if (spawnedLane !== fiber_lane_constants_1.NoLane) {
        markSpawnedDeferredLane(root, spawnedLane, suspendedLanes);
    }
}
exports.markRootSuspendedInternal = markRootSuspendedInternal;
function markRootPinged(root, pingedLanes) {
    root.pingedLanes |= root.suspendedLanes & pingedLanes;
}
exports.markRootPinged = markRootPinged;
function markRootFinished(root, remainingLanes, spawnedLane) {
    var noLongerPendingLanes = root.pendingLanes & ~remainingLanes;
    root.pendingLanes = remainingLanes;
    // Let's try everything again
    root.suspendedLanes = fiber_lane_constants_1.NoLanes;
    root.pingedLanes = fiber_lane_constants_1.NoLanes;
    root.expiredLanes &= remainingLanes;
    root.entangledLanes &= remainingLanes;
    root.errorRecoveryDisabledLanes &= remainingLanes;
    root.shellSuspendCounter = 0;
    var entanglements = root.entanglements;
    var expirationTimes = root.expirationTimes;
    var hiddenUpdates = root.hiddenUpdates;
    // Clear the lanes that no longer have pending work
    var lanes = noLongerPendingLanes;
    while (lanes > 0) {
        var index = (0, react_fiber_lane_1.pickArbitraryLaneIndex)(lanes);
        var lane = 1 << index;
        entanglements[index] = fiber_lane_constants_1.NoLanes;
        expirationTimes[index] = react_fiber_lane_1.NoTimestamp;
        var hiddenUpdatesForLane = hiddenUpdates[index];
        if (hiddenUpdatesForLane !== null) {
            hiddenUpdates[index] = null;
            // "Hidden" updates are updates that were made to a hidden component. They
            // have special logic associated with them because they may be entangled
            // with updates that occur outside that tree. But once the outer tree
            // commits, they behave like regular updates.
            for (var i = 0; i < hiddenUpdatesForLane.length; i++) {
                var update = hiddenUpdatesForLane[i];
                if (update !== null) {
                    update.lane &= ~fiber_lane_constants_1.OffscreenLane;
                }
            }
        }
        lanes &= ~lane;
    }
    if (spawnedLane !== fiber_lane_constants_1.NoLane) {
        markSpawnedDeferredLane(root, spawnedLane, // This render finished successfully without suspending, so we don't need
        // to entangle the spawned task with the parent task.
        fiber_lane_constants_1.NoLanes);
    }
}
exports.markRootFinished = markRootFinished;
