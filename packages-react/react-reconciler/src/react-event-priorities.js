"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lanesToEventPriority = exports.isHigherEventPriority = exports.lowerEventPriority = exports.higherEventPriority = exports.runWithPriority = exports.setCurrentUpdatePriority = exports.getCurrentUpdatePriority = exports.IdleEventPriority = exports.DefaultEventPriority = exports.ContinuousEventPriority = exports.DiscreteEventPriority = void 0;
var fiber_lane_constants_1 = require("@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants");
// TODO: Convert to enum
exports.DiscreteEventPriority = fiber_lane_constants_1.SyncLane;
exports.ContinuousEventPriority = fiber_lane_constants_1.InputContinuousLane;
exports.DefaultEventPriority = fiber_lane_constants_1.DefaultLane;
exports.IdleEventPriority = fiber_lane_constants_1.IdleLane;
var currentUpdatePriority = fiber_lane_constants_1.NoLane;
function getCurrentUpdatePriority() {
    return currentUpdatePriority;
}
exports.getCurrentUpdatePriority = getCurrentUpdatePriority;
function setCurrentUpdatePriority(newPriority) {
    currentUpdatePriority = newPriority;
}
exports.setCurrentUpdatePriority = setCurrentUpdatePriority;
function runWithPriority(priority, fn) {
    var previousPriority = currentUpdatePriority;
    try {
        currentUpdatePriority = priority;
        return fn();
    }
    finally {
        currentUpdatePriority = previousPriority;
    }
}
exports.runWithPriority = runWithPriority;
function higherEventPriority(a, b) {
    return a !== 0 && a < b ? a : b;
}
exports.higherEventPriority = higherEventPriority;
function lowerEventPriority(a, b) {
    return a === 0 || a > b ? a : b;
}
exports.lowerEventPriority = lowerEventPriority;
function isHigherEventPriority(a, b) {
    return a !== 0 && a < b;
}
exports.isHigherEventPriority = isHigherEventPriority;
function lanesToEventPriority(lanes) {
    var lane = (0, fiber_lane_constants_1.getHighestPriorityLane)(lanes);
    if (!isHigherEventPriority(exports.DiscreteEventPriority, lane)) {
        return exports.DiscreteEventPriority;
    }
    if (!isHigherEventPriority(exports.ContinuousEventPriority, lane)) {
        return exports.ContinuousEventPriority;
    }
    if ((0, fiber_lane_constants_1.includesNonIdleWork)(lane)) {
        return exports.DefaultEventPriority;
    }
    return exports.IdleEventPriority;
}
exports.lanesToEventPriority = lanesToEventPriority;
