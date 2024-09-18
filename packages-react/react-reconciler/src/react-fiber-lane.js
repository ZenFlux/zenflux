"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearTransitionsForLanes = exports.getTransitionsForLanes = exports.addTransitionToLanesMap = exports.movePendingFibersToMemoized = exports.addFiberToLanesMap = exports.getBumpedLaneForHydration = exports.markHiddenUpdate = exports.upgradePendingLanesToSync = exports.upgradePendingLaneToSync = exports.createLaneMap = exports.higherPriorityLane = exports.laneToLanes = exports.intersectLanes = exports.removeLanes = exports.mergeLanes = exports.isSubsetOfLanes = exports.includesSomeLane = exports.pickArbitraryLaneIndex = exports.pickArbitraryLane = exports.claimNextRetryLane = exports.claimNextTransitionLane = exports.getLanesToRetrySynchronouslyOnError = exports.getHighestPriorityPendingLanes = exports.markStarvedLanesAsExpired = exports.getNextLanes = exports.NoTimestamp = void 0;
var react_feature_flags_1 = require("@zenflux/react-shared/src/react-feature-flags");
var fiber_lane_constants_1 = require("@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants");
var clz32_1 = require("@zenflux/react-reconciler/src/clz32");
var react_fiber_dev_tools_hook_1 = require("@zenflux/react-reconciler/src/react-fiber-dev-tools-hook");
exports.NoTimestamp = -1;
var nextTransitionLane = fiber_lane_constants_1.TransitionLane1;
var nextRetryLane = fiber_lane_constants_1.RetryLane1;
function getNextLanes(root, wipLanes) {
    // Early bailout if there's no pending work left.
    var pendingLanes = root.pendingLanes;
    if (pendingLanes === fiber_lane_constants_1.NoLanes) {
        return fiber_lane_constants_1.NoLanes;
    }
    var nextLanes = fiber_lane_constants_1.NoLanes;
    var suspendedLanes = root.suspendedLanes;
    var pingedLanes = root.pingedLanes;
    // Do not work on any idle work until all the non-idle work has finished,
    // even if the work is suspended.
    var nonIdlePendingLanes = pendingLanes & fiber_lane_constants_1.NonIdleLanes;
    if (nonIdlePendingLanes !== fiber_lane_constants_1.NoLanes) {
        var nonIdleUnblockedLanes = nonIdlePendingLanes & ~suspendedLanes;
        if (nonIdleUnblockedLanes !== fiber_lane_constants_1.NoLanes) {
            nextLanes = (0, fiber_lane_constants_1.getHighestPriorityLanes)(nonIdleUnblockedLanes);
        }
        else {
            var nonIdlePingedLanes = nonIdlePendingLanes & pingedLanes;
            if (nonIdlePingedLanes !== fiber_lane_constants_1.NoLanes) {
                nextLanes = (0, fiber_lane_constants_1.getHighestPriorityLanes)(nonIdlePingedLanes);
            }
        }
    }
    else {
        // The only remaining work is Idle.
        var unblockedLanes = pendingLanes & ~suspendedLanes;
        if (unblockedLanes !== fiber_lane_constants_1.NoLanes) {
            nextLanes = (0, fiber_lane_constants_1.getHighestPriorityLanes)(unblockedLanes);
        }
        else {
            if (pingedLanes !== fiber_lane_constants_1.NoLanes) {
                nextLanes = (0, fiber_lane_constants_1.getHighestPriorityLanes)(pingedLanes);
            }
        }
    }
    if (nextLanes === fiber_lane_constants_1.NoLanes) {
        // This should only be reachable if we're suspended
        // TODO: Consider warning in this path if a fallback timer is not scheduled.
        return fiber_lane_constants_1.NoLanes;
    }
    // If we're already in the middle of a render, switching lanes will interrupt
    // it and we'll lose our progress. We should only do this if the new lanes are
    // higher priority.
    if (wipLanes !== fiber_lane_constants_1.NoLanes && wipLanes !== nextLanes && // If we already suspended with a delay, then interrupting is fine. Don't
        // bother waiting until the root is complete.
        (wipLanes & suspendedLanes) === fiber_lane_constants_1.NoLanes) {
        var nextLane = (0, fiber_lane_constants_1.getHighestPriorityLane)(nextLanes);
        var wipLane = (0, fiber_lane_constants_1.getHighestPriorityLane)(wipLanes);
        if ( // Tests whether the next lane is equal or lower priority than the wip
        // one. This works because the bits decrease in priority as you go left.
        nextLane >= wipLane || // Default priority updates should not interrupt transition updates. The
            // only difference between default updates and transition updates is that
            // default updates do not support refresh transitions.
            nextLane === fiber_lane_constants_1.DefaultLane && (wipLane & fiber_lane_constants_1.TransitionLanes) !== fiber_lane_constants_1.NoLanes) {
            // Keep working on the existing in-progress tree. Do not interrupt.
            return wipLanes;
        }
    }
    return nextLanes;
}
exports.getNextLanes = getNextLanes;
function computeExpirationTime(lane, currentTime) {
    switch (lane) {
        case fiber_lane_constants_1.SyncHydrationLane:
        case fiber_lane_constants_1.SyncLane:
        case fiber_lane_constants_1.InputContinuousHydrationLane:
        case fiber_lane_constants_1.InputContinuousLane:
            // User interactions should expire slightly more quickly.
            //
            // NOTE: This is set to the corresponding constant as in Scheduler.js.
            // When we made it larger, a product metric in www regressed, suggesting
            // there's a user interaction that's being starved by a series of
            // synchronous updates. If that theory is correct, the proper solution is
            // to fix the starvation. However, this scenario supports the idea that
            // expiration times are an important safeguard when starvation
            // does happen.
            return currentTime + 250;
        case fiber_lane_constants_1.DefaultHydrationLane:
        case fiber_lane_constants_1.DefaultLane:
        case fiber_lane_constants_1.TransitionHydrationLane:
        case fiber_lane_constants_1.TransitionLane1:
        case fiber_lane_constants_1.TransitionLane2:
        case fiber_lane_constants_1.TransitionLane3:
        case fiber_lane_constants_1.TransitionLane4:
        case fiber_lane_constants_1.TransitionLane5:
        case fiber_lane_constants_1.TransitionLane6:
        case fiber_lane_constants_1.TransitionLane7:
        case fiber_lane_constants_1.TransitionLane8:
        case fiber_lane_constants_1.TransitionLane9:
        case fiber_lane_constants_1.TransitionLane10:
        case fiber_lane_constants_1.TransitionLane11:
        case fiber_lane_constants_1.TransitionLane12:
        case fiber_lane_constants_1.TransitionLane13:
        case fiber_lane_constants_1.TransitionLane14:
        case fiber_lane_constants_1.TransitionLane15:
            return currentTime + 5000;
        case fiber_lane_constants_1.RetryLane1:
        case fiber_lane_constants_1.RetryLane2:
        case fiber_lane_constants_1.RetryLane3:
        case fiber_lane_constants_1.RetryLane4:
            // TODO: Retries should be allowed to expire if they are CPU bound for
            // too long, but when I made this change it caused a spike in browser
            // crashes. There must be some other underlying bug; not super urgent but
            // ideally should figure out why and fix it. Unfortunately we don't have
            // a repro for the crashes, only detected via production metrics.
            return exports.NoTimestamp;
        case fiber_lane_constants_1.SelectiveHydrationLane:
        case fiber_lane_constants_1.IdleHydrationLane:
        case fiber_lane_constants_1.IdleLane:
        case fiber_lane_constants_1.OffscreenLane:
        case fiber_lane_constants_1.DeferredLane:
            // Anything idle priority or lower should never expire.
            return exports.NoTimestamp;
        default:
            if (__DEV__) {
                console.error("Should have found matching lanes. This is a bug in React.");
            }
            return exports.NoTimestamp;
    }
}
function markStarvedLanesAsExpired(root, currentTime) {
    // TODO: This gets called every time we yield. We can optimize by storing
    // the earliest expiration time on the root. Then use that to quickly bail out
    // of this function.
    var pendingLanes = root.pendingLanes;
    var suspendedLanes = root.suspendedLanes;
    var pingedLanes = root.pingedLanes;
    var expirationTimes = root.expirationTimes;
    // Iterate through the pending lanes and check if we've reached their
    // expiration time. If so, we'll assume the update is being starved and mark
    // it as expired to force it to finish.
    // TODO: We should be able to replace this with upgradePendingLanesToSync
    //
    // We exclude retry lanes because those must always be time sliced, in order
    // to unwrap uncached promises.
    // TODO: Write a test for this
    var lanes = pendingLanes & ~fiber_lane_constants_1.RetryLanes;
    while (lanes > 0) {
        var index = pickArbitraryLaneIndex(lanes);
        var lane = 1 << index;
        var expirationTime = expirationTimes[index];
        if (expirationTime === exports.NoTimestamp) {
            // Found a pending lane with no expiration time. If it's not suspended, or
            // if it's pinged, assume it's CPU-bound. Compute a new expiration time
            // using the current time.
            if ((lane & suspendedLanes) === fiber_lane_constants_1.NoLanes || (lane & pingedLanes) !== fiber_lane_constants_1.NoLanes) {
                // Assumes timestamps are monotonically increasing.
                expirationTimes[index] = computeExpirationTime(lane, currentTime);
            }
        }
        else if (expirationTime <= currentTime) {
            // This lane expired
            root.expiredLanes |= lane;
        }
        lanes &= ~lane;
    }
}
exports.markStarvedLanesAsExpired = markStarvedLanesAsExpired;
// This returns the highest priority pending lanes regardless of whether they
// are suspended.
function getHighestPriorityPendingLanes(root) {
    return (0, fiber_lane_constants_1.getHighestPriorityLanes)(root.pendingLanes);
}
exports.getHighestPriorityPendingLanes = getHighestPriorityPendingLanes;
function getLanesToRetrySynchronouslyOnError(root, originallyAttemptedLanes) {
    if (root.errorRecoveryDisabledLanes & originallyAttemptedLanes) {
        // The error recovery mechanism is disabled until these lanes are cleared.
        return fiber_lane_constants_1.NoLanes;
    }
    var everythingButOffscreen = root.pendingLanes & ~fiber_lane_constants_1.OffscreenLane;
    if (everythingButOffscreen !== fiber_lane_constants_1.NoLanes) {
        return everythingButOffscreen;
    }
    if (everythingButOffscreen & fiber_lane_constants_1.OffscreenLane) {
        return fiber_lane_constants_1.OffscreenLane;
    }
    return fiber_lane_constants_1.NoLanes;
}
exports.getLanesToRetrySynchronouslyOnError = getLanesToRetrySynchronouslyOnError;
function claimNextTransitionLane() {
    // Cycle through the lanes, assigning each new transition to the next lane.
    // In most cases, this means every transition gets its own lane, until we
    // run out of lanes and cycle back to the beginning.
    var lane = nextTransitionLane;
    nextTransitionLane <<= 1;
    if ((nextTransitionLane & fiber_lane_constants_1.TransitionLanes) === fiber_lane_constants_1.NoLanes) {
        nextTransitionLane = fiber_lane_constants_1.TransitionLane1;
    }
    return lane;
}
exports.claimNextTransitionLane = claimNextTransitionLane;
function claimNextRetryLane() {
    var lane = nextRetryLane;
    nextRetryLane <<= 1;
    if ((nextRetryLane & fiber_lane_constants_1.RetryLanes) === fiber_lane_constants_1.NoLanes) {
        nextRetryLane = fiber_lane_constants_1.RetryLane1;
    }
    return lane;
}
exports.claimNextRetryLane = claimNextRetryLane;
function pickArbitraryLane(lanes) {
    // This wrapper function gets inlined. Only exists so to communicate that it
    // doesn't matter which bit is selected; you can pick any bit without
    // affecting the algorithms where its used. Here I'm using
    // getHighestPriorityLane because it requires the fewest operations.
    return (0, fiber_lane_constants_1.getHighestPriorityLane)(lanes);
}
exports.pickArbitraryLane = pickArbitraryLane;
function pickArbitraryLaneIndex(lanes) {
    return 31 - (0, clz32_1.clz32)(lanes);
}
exports.pickArbitraryLaneIndex = pickArbitraryLaneIndex;
function includesSomeLane(a, b) {
    return (a & b) !== fiber_lane_constants_1.NoLanes;
}
exports.includesSomeLane = includesSomeLane;
function isSubsetOfLanes(set, subset) {
    return (set & subset) === subset;
}
exports.isSubsetOfLanes = isSubsetOfLanes;
function mergeLanes(a, b) {
    return a | b;
}
exports.mergeLanes = mergeLanes;
function removeLanes(set, subset) {
    return set & ~subset;
}
exports.removeLanes = removeLanes;
function intersectLanes(a, b) {
    return a & b;
}
exports.intersectLanes = intersectLanes;
// Seems redundant, but it changes the type from a single lane (used for
// updates) to a group of lanes (used for flushing work).
function laneToLanes(lane) {
    return lane;
}
exports.laneToLanes = laneToLanes;
function higherPriorityLane(a, b) {
    // This works because the bit ranges decrease in priority as you go left.
    return a !== fiber_lane_constants_1.NoLane && a < b ? a : b;
}
exports.higherPriorityLane = higherPriorityLane;
function createLaneMap(initial) {
    // Intentionally pushing one by one.
    // https://v8.dev/blog/elements-kinds#avoid-creating-holes
    var laneMap = [];
    for (var i = 0; i < fiber_lane_constants_1.TotalLanes; i++) {
        laneMap.push(initial);
    }
    return laneMap;
}
exports.createLaneMap = createLaneMap;
function upgradePendingLaneToSync(root, lane) {
    // Since we're upgrading the priority of the given lane, there is now pending
    // sync work.
    root.pendingLanes |= fiber_lane_constants_1.SyncLane;
    // Entangle the sync lane with the lane we're upgrading. This means SyncLane
    // will not be allowed to finish without also finishing the given lane.
    root.entangledLanes |= fiber_lane_constants_1.SyncLane;
    root.entanglements[fiber_lane_constants_1.SyncLaneIndex] |= lane;
}
exports.upgradePendingLaneToSync = upgradePendingLaneToSync;
function upgradePendingLanesToSync(root, lanesToUpgrade) {
    // Same as upgradePendingLaneToSync but accepts multiple lanes, so it's a
    // bit slower.
    root.pendingLanes |= fiber_lane_constants_1.SyncLane;
    root.entangledLanes |= fiber_lane_constants_1.SyncLane;
    var lanes = lanesToUpgrade;
    while (lanes) {
        var index = pickArbitraryLaneIndex(lanes);
        var lane = 1 << index;
        root.entanglements[fiber_lane_constants_1.SyncLaneIndex] |= lane;
        lanes &= ~lane;
    }
}
exports.upgradePendingLanesToSync = upgradePendingLanesToSync;
function markHiddenUpdate(root, update, lane) {
    var index = pickArbitraryLaneIndex(lane);
    var hiddenUpdates = root.hiddenUpdates;
    var hiddenUpdatesForLane = hiddenUpdates[index];
    if (hiddenUpdatesForLane === null) {
        hiddenUpdates[index] = [update];
    }
    else {
        hiddenUpdatesForLane.push(update);
    }
    update.lane = lane | fiber_lane_constants_1.OffscreenLane;
}
exports.markHiddenUpdate = markHiddenUpdate;
function getBumpedLaneForHydration(root, renderLanes) {
    var renderLane = (0, fiber_lane_constants_1.getHighestPriorityLane)(renderLanes);
    var lane;
    if (react_feature_flags_1.enableUnifiedSyncLane && (renderLane & fiber_lane_constants_1.SyncUpdateLanes) !== fiber_lane_constants_1.NoLane) {
        lane = fiber_lane_constants_1.SyncHydrationLane;
    }
    else {
        switch (renderLane) {
            case fiber_lane_constants_1.SyncLane:
                lane = fiber_lane_constants_1.SyncHydrationLane;
                break;
            case fiber_lane_constants_1.InputContinuousLane:
                lane = fiber_lane_constants_1.InputContinuousHydrationLane;
                break;
            case fiber_lane_constants_1.DefaultLane:
                lane = fiber_lane_constants_1.DefaultHydrationLane;
                break;
            case fiber_lane_constants_1.TransitionLane1:
            case fiber_lane_constants_1.TransitionLane2:
            case fiber_lane_constants_1.TransitionLane3:
            case fiber_lane_constants_1.TransitionLane4:
            case fiber_lane_constants_1.TransitionLane5:
            case fiber_lane_constants_1.TransitionLane6:
            case fiber_lane_constants_1.TransitionLane7:
            case fiber_lane_constants_1.TransitionLane8:
            case fiber_lane_constants_1.TransitionLane9:
            case fiber_lane_constants_1.TransitionLane10:
            case fiber_lane_constants_1.TransitionLane11:
            case fiber_lane_constants_1.TransitionLane12:
            case fiber_lane_constants_1.TransitionLane13:
            case fiber_lane_constants_1.TransitionLane14:
            case fiber_lane_constants_1.TransitionLane15:
            case fiber_lane_constants_1.RetryLane1:
            case fiber_lane_constants_1.RetryLane2:
            case fiber_lane_constants_1.RetryLane3:
            case fiber_lane_constants_1.RetryLane4:
                lane = fiber_lane_constants_1.TransitionHydrationLane;
                break;
            case fiber_lane_constants_1.IdleLane:
                lane = fiber_lane_constants_1.IdleHydrationLane;
                break;
            default:
                // Everything else is already either a hydration lane, or shouldn't
                // be retried at a hydration lane.
                lane = fiber_lane_constants_1.NoLane;
                break;
        }
    }
    // Check if the lane we chose is suspended. If so, that indicates that we
    // already attempted and failed to hydrate at that level. Also check if we're
    // already rendering that lane, which is rare but could happen.
    if ((lane & (root.suspendedLanes | renderLanes)) !== fiber_lane_constants_1.NoLane) {
        // Give up trying to hydrate and fall back to client render.
        return fiber_lane_constants_1.NoLane;
    }
    return lane;
}
exports.getBumpedLaneForHydration = getBumpedLaneForHydration;
function addFiberToLanesMap(root, fiber, lanes) {
    if (!react_feature_flags_1.enableUpdaterTracking) {
        return;
    }
    if (!react_fiber_dev_tools_hook_1.isDevToolsPresent) {
        return;
    }
    var pendingUpdatersLaneMap = root.pendingUpdatersLaneMap;
    while (lanes > 0) {
        var index = pickArbitraryLaneIndex(lanes);
        var lane = 1 << index;
        var updaters = pendingUpdatersLaneMap[index];
        updaters.add(fiber);
        lanes &= ~lane;
    }
}
exports.addFiberToLanesMap = addFiberToLanesMap;
function movePendingFibersToMemoized(root, lanes) {
    if (!react_feature_flags_1.enableUpdaterTracking) {
        return;
    }
    if (!react_fiber_dev_tools_hook_1.isDevToolsPresent) {
        return;
    }
    var pendingUpdatersLaneMap = root.pendingUpdatersLaneMap;
    var memoizedUpdaters = root.memoizedUpdaters;
    while (lanes > 0) {
        var index = pickArbitraryLaneIndex(lanes);
        var lane = 1 << index;
        var updaters = pendingUpdatersLaneMap[index];
        if (updaters.size > 0) {
            updaters.forEach(function (fiber) {
                var alternate = fiber.alternate;
                if (alternate === null || !memoizedUpdaters.has(alternate)) {
                    memoizedUpdaters.add(fiber);
                }
            });
            updaters.clear();
        }
        lanes &= ~lane;
    }
}
exports.movePendingFibersToMemoized = movePendingFibersToMemoized;
function addTransitionToLanesMap(root, transition, lane) {
    if (react_feature_flags_1.enableTransitionTracing) {
        var transitionLanesMap = root.transitionLanes;
        var index = pickArbitraryLaneIndex(lane);
        var transitions = transitionLanesMap[index];
        if (transitions === null) {
            transitions = new Set();
        }
        transitions.add(transition);
        transitionLanesMap[index] = transitions;
    }
}
exports.addTransitionToLanesMap = addTransitionToLanesMap;
function getTransitionsForLanes(root, lanes) {
    if (!react_feature_flags_1.enableTransitionTracing) {
        return null;
    }
    var transitionsForLanes = [];
    while (lanes > 0) {
        var index = pickArbitraryLaneIndex(lanes);
        var lane = 1 << index;
        var transitions = root.transitionLanes[index];
        if (transitions !== null) {
            transitions.forEach(function (transition) {
                transitionsForLanes.push(transition);
            });
        }
        lanes &= ~lane;
    }
    if (transitionsForLanes.length === 0) {
        return null;
    }
    return transitionsForLanes;
}
exports.getTransitionsForLanes = getTransitionsForLanes;
function clearTransitionsForLanes(root, lanes) {
    if (!react_feature_flags_1.enableTransitionTracing) {
        return;
    }
    while (lanes > 0) {
        var index = pickArbitraryLaneIndex(lanes);
        var lane = 1 << index;
        var transitions = root.transitionLanes[index];
        if (transitions !== null) {
            root.transitionLanes[index] = null;
        }
        lanes &= ~lane;
    }
}
exports.clearTransitionsForLanes = clearTransitionsForLanes;
