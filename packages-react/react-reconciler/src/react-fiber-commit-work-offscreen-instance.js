"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.attachOffscreenInstance = exports.detachOffscreenInstance = void 0;
var offscreen_1 = require("@zenflux/react-shared/src/react-internal-constants/offscreen");
var fiber_flags_1 = require("@zenflux/react-shared/src/react-internal-constants/fiber-flags");
var fiber_lane_constants_1 = require("@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants");
var react_fiber_concurrent_updates_1 = require("@zenflux/react-reconciler/src/react-fiber-concurrent-updates");
var react_fiber_work_schedule_update_1 = require("@zenflux/react-reconciler/src/react-fiber-work-schedule-update");
function detachOffscreenInstance(instance) {
    var fiber = instance._current;
    if (fiber === null) {
        throw new Error("Calling Offscreen.detach before instance handle has been set.");
    }
    if ((instance._pendingVisibility & offscreen_1.OffscreenDetached) !== fiber_flags_1.FiberFlags.NoFlags) {
        // The instance is already detached, this is a noop.
        return;
    }
    // TODO: There is an opportunity to optimise this by not entering commit phase
    // and unmounting effects directly.
    var root = (0, react_fiber_concurrent_updates_1.enqueueConcurrentRenderForLane)(fiber, fiber_lane_constants_1.SyncLane);
    if (root !== null) {
        instance._pendingVisibility |= offscreen_1.OffscreenDetached;
        (0, react_fiber_work_schedule_update_1.scheduleUpdateOnFiber)(root, fiber, fiber_lane_constants_1.SyncLane);
    }
}
exports.detachOffscreenInstance = detachOffscreenInstance;
function attachOffscreenInstance(instance) {
    var fiber = instance._current;
    if (fiber === null) {
        throw new Error("Calling Offscreen.detach before instance handle has been set.");
    }
    if ((instance._pendingVisibility & offscreen_1.OffscreenDetached) === fiber_flags_1.FiberFlags.NoFlags) {
        // The instance is already attached, this is a noop.
        return;
    }
    var root = (0, react_fiber_concurrent_updates_1.enqueueConcurrentRenderForLane)(fiber, fiber_lane_constants_1.SyncLane);
    if (root !== null) {
        instance._pendingVisibility &= ~offscreen_1.OffscreenDetached;
        (0, react_fiber_work_schedule_update_1.scheduleUpdateOnFiber)(root, fiber, fiber_lane_constants_1.SyncLane);
    }
}
exports.attachOffscreenInstance = attachOffscreenInstance;
