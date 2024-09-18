"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.includesBlockingLane = exports.includesOnlyTransitions = exports.includesOnlyNonUrgentLanes = exports.includesOnlyRetries = exports.includesNonIdleWork = exports.includesSyncLane = exports.getHighestPriorityLanes = exports.getHighestPriorityLane = exports.getLabelForLane = exports.UpdateLanes = exports.DeferredLane = exports.OffscreenLane = exports.IdleLane = exports.IdleHydrationLane = exports.NonIdleLanes = exports.SelectiveHydrationLane = exports.SomeRetryLane = exports.RetryLane4 = exports.RetryLane3 = exports.RetryLane2 = exports.RetryLane1 = exports.RetryLanes = exports.TransitionLane15 = exports.TransitionLane14 = exports.TransitionLane13 = exports.TransitionLane12 = exports.TransitionLane11 = exports.TransitionLane10 = exports.TransitionLane9 = exports.TransitionLane8 = exports.TransitionLane7 = exports.TransitionLane6 = exports.TransitionLane5 = exports.TransitionLane4 = exports.TransitionLane3 = exports.TransitionLane2 = exports.TransitionLane1 = exports.TransitionLanes = exports.TransitionHydrationLane = exports.SyncUpdateLanes = exports.DefaultLane = exports.DefaultHydrationLane = exports.InputContinuousLane = exports.InputContinuousHydrationLane = exports.SyncLaneIndex = exports.SyncLane = exports.SyncHydrationLane = exports.NoLane = exports.NoLanes = exports.TotalLanes = void 0;
exports.isTransitionLane = exports.includesExpiredLane = void 0;
// eslint-disable-next-line no-restricted-imports
var type_of_mode_1 = require("./type-of-mode");
var react_feature_flags_1 = require("@zenflux/react-shared/src/react-feature-flags");
// Lane values below should be kept in sync with getLabelForLane(), used by react-devtools-timeline.
// If those values are changed that package should be rebuilt and redeployed.
exports.TotalLanes = 31;
exports.NoLanes = 
/*                        */
0;
exports.NoLane = 
/*                          */
0;
exports.SyncHydrationLane = 
/*               */
1;
exports.SyncLane = 
/*                        */
2;
exports.SyncLaneIndex = 1;
exports.InputContinuousHydrationLane = 
/*    */
4;
exports.InputContinuousLane = 
/*             */
8;
exports.DefaultHydrationLane = 
/*            */
16;
exports.DefaultLane = 
/*                     */
32;
exports.SyncUpdateLanes = react_feature_flags_1.enableUnifiedSyncLane ? exports.SyncLane | exports.InputContinuousLane | exports.DefaultLane : exports.SyncLane;
exports.TransitionHydrationLane = 
/*                */
64;
exports.TransitionLanes = 
/*                       */
4194176;
exports.TransitionLane1 = 
/*                        */
128;
exports.TransitionLane2 = 
/*                        */
256;
exports.TransitionLane3 = 
/*                        */
512;
exports.TransitionLane4 = 
/*                        */
1024;
exports.TransitionLane5 = 
/*                        */
2048;
exports.TransitionLane6 = 
/*                        */
4096;
exports.TransitionLane7 = 
/*                        */
8192;
exports.TransitionLane8 = 
/*                        */
16384;
exports.TransitionLane9 = 
/*                        */
32768;
exports.TransitionLane10 = 
/*                       */
65536;
exports.TransitionLane11 = 
/*                       */
131072;
exports.TransitionLane12 = 
/*                       */
262144;
exports.TransitionLane13 = 
/*                       */
524288;
exports.TransitionLane14 = 
/*                       */
1048576;
exports.TransitionLane15 = 
/*                       */
2097152;
exports.RetryLanes = 
/*                            */
62914560;
exports.RetryLane1 = 
/*                             */
4194304;
exports.RetryLane2 = 
/*                             */
8388608;
exports.RetryLane3 = 
/*                             */
16777216;
exports.RetryLane4 = 
/*                             */
33554432;
exports.SomeRetryLane = exports.RetryLane1;
exports.SelectiveHydrationLane = 
/*          */
67108864;
exports.NonIdleLanes = 
/*                          */
134217727;
exports.IdleHydrationLane = 
/*               */
134217728;
exports.IdleLane = 
/*                        */
268435456;
exports.OffscreenLane = 
/*                   */
536870912;
exports.DeferredLane = 
/*                    */
1073741824;
// Any lane that might schedule an update. This is used to detect infinite
// update loops, so it doesn't include hydration lanes or retries.
exports.UpdateLanes = exports.SyncLane | exports.InputContinuousLane | exports.DefaultLane | exports.TransitionLanes;
// This function is used for the experimental timeline (react-devtools-timeline)
// It should be kept in sync with the Lanes values above.
function getLabelForLane(lane) {
    if (react_feature_flags_1.enableSchedulingProfiler) {
        if (lane & exports.SyncHydrationLane) {
            return "SyncHydrationLane";
        }
        if (lane & exports.SyncLane) {
            return "Sync";
        }
        if (lane & exports.InputContinuousHydrationLane) {
            return "InputContinuousHydration";
        }
        if (lane & exports.InputContinuousLane) {
            return "InputContinuous";
        }
        if (lane & exports.DefaultHydrationLane) {
            return "DefaultHydration";
        }
        if (lane & exports.DefaultLane) {
            return "Default";
        }
        if (lane & exports.TransitionHydrationLane) {
            return "TransitionHydration";
        }
        if (lane & exports.TransitionLanes) {
            return "Transition";
        }
        if (lane & exports.RetryLanes) {
            return "Retry";
        }
        if (lane & exports.SelectiveHydrationLane) {
            return "SelectiveHydration";
        }
        if (lane & exports.IdleHydrationLane) {
            return "IdleHydration";
        }
        if (lane & exports.IdleLane) {
            return "Idle";
        }
        if (lane & exports.OffscreenLane) {
            return "Offscreen";
        }
        if (lane & exports.DeferredLane) {
            return "Deferred";
        }
    }
}
exports.getLabelForLane = getLabelForLane;
function getHighestPriorityLane(lanes) {
    return lanes & -lanes;
}
exports.getHighestPriorityLane = getHighestPriorityLane;
function getHighestPriorityLanes(lanes) {
    if (react_feature_flags_1.enableUnifiedSyncLane) {
        var pendingSyncLanes = lanes & exports.SyncUpdateLanes;
        if (pendingSyncLanes !== 0) {
            return pendingSyncLanes;
        }
    }
    switch (getHighestPriorityLane(lanes)) {
        case exports.SyncHydrationLane:
            return exports.SyncHydrationLane;
        case exports.SyncLane:
            return exports.SyncLane;
        case exports.InputContinuousHydrationLane:
            return exports.InputContinuousHydrationLane;
        case exports.InputContinuousLane:
            return exports.InputContinuousLane;
        case exports.DefaultHydrationLane:
            return exports.DefaultHydrationLane;
        case exports.DefaultLane:
            return exports.DefaultLane;
        case exports.TransitionHydrationLane:
            return exports.TransitionHydrationLane;
        case exports.TransitionLane1:
        case exports.TransitionLane2:
        case exports.TransitionLane3:
        case exports.TransitionLane4:
        case exports.TransitionLane5:
        case exports.TransitionLane6:
        case exports.TransitionLane7:
        case exports.TransitionLane8:
        case exports.TransitionLane9:
        case exports.TransitionLane10:
        case exports.TransitionLane11:
        case exports.TransitionLane12:
        case exports.TransitionLane13:
        case exports.TransitionLane14:
        case exports.TransitionLane15:
            return lanes & exports.TransitionLanes;
        case exports.RetryLane1:
        case exports.RetryLane2:
        case exports.RetryLane3:
        case exports.RetryLane4:
            return lanes & exports.RetryLanes;
        case exports.SelectiveHydrationLane:
            return exports.SelectiveHydrationLane;
        case exports.IdleHydrationLane:
            return exports.IdleHydrationLane;
        case exports.IdleLane:
            return exports.IdleLane;
        case exports.OffscreenLane:
            return exports.OffscreenLane;
        case exports.DeferredLane:
            // This shouldn't be reachable because deferred work is always entangled
            // with something else.
            return exports.NoLanes;
        default:
            if (__DEV__) {
                console.error("Should have found matching lanes. This is a bug in React.");
            }
            // This shouldn't be reachable, but as a fallback, return the entire bitmask.
            return lanes;
    }
}
exports.getHighestPriorityLanes = getHighestPriorityLanes;
function includesSyncLane(lanes) {
    return (lanes & (exports.SyncLane | exports.SyncHydrationLane)) !== exports.NoLanes;
}
exports.includesSyncLane = includesSyncLane;
function includesNonIdleWork(lanes) {
    return (lanes & exports.NonIdleLanes) !== exports.NoLanes;
}
exports.includesNonIdleWork = includesNonIdleWork;
function includesOnlyRetries(lanes) {
    return (lanes & exports.RetryLanes) === lanes;
}
exports.includesOnlyRetries = includesOnlyRetries;
function includesOnlyNonUrgentLanes(lanes) {
    // TODO: Should hydration lanes be included here? This function is only
    // used in `updateDeferredValueImpl`.
    var UrgentLanes = exports.SyncLane | exports.InputContinuousLane | exports.DefaultLane;
    return (lanes & UrgentLanes) === exports.NoLanes;
}
exports.includesOnlyNonUrgentLanes = includesOnlyNonUrgentLanes;
function includesOnlyTransitions(lanes) {
    return (lanes & exports.TransitionLanes) === lanes;
}
exports.includesOnlyTransitions = includesOnlyTransitions;
function includesBlockingLane(root, lanes) {
    if (react_feature_flags_1.allowConcurrentByDefault && (root.current.mode & type_of_mode_1.TypeOfMode.ConcurrentUpdatesByDefaultMode) !== type_of_mode_1.TypeOfMode.NoMode) {
        // Concurrent updates by default always use time slicing.
        return false;
    }
    var SyncDefaultLanes = exports.InputContinuousHydrationLane | exports.InputContinuousLane | exports.DefaultHydrationLane | exports.DefaultLane;
    return (lanes & SyncDefaultLanes) !== exports.NoLanes;
}
exports.includesBlockingLane = includesBlockingLane;
function includesExpiredLane(root, lanes) {
    // This is a separate check from includesBlockingLane because a lane can
    // expire after a render has already started.
    return (lanes & root.expiredLanes) !== exports.NoLanes;
}
exports.includesExpiredLane = includesExpiredLane;
function isTransitionLane(lane) {
    return (lane & exports.TransitionLanes) !== exports.NoLanes;
}
exports.isTransitionLane = isTransitionLane;
