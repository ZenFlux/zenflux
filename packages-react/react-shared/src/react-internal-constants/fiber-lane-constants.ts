// eslint-disable-next-line no-restricted-imports
import { TypeOfMode } from "./type-of-mode";

import {
    allowConcurrentByDefault,
    enableSchedulingProfiler,
    enableUnifiedSyncLane
} from "@zenflux/react-shared/src/react-feature-flags";

import type { Lanes, Lane, FiberRoot } from "@zenflux/react-shared/src/react-internal-types";

// Lane values below should be kept in sync with getLabelForLane(), used by react-devtools-timeline.
// If those values are changed that package should be rebuilt and redeployed.
export const TotalLanes = 31;
export const NoLanes: Lanes =
    /*                        */
    0b0000000000000000000000000000000;
export const NoLane: Lane =
    /*                          */
    0b0000000000000000000000000000000;
export const SyncHydrationLane: Lane =
    /*               */
    0b0000000000000000000000000000001;
export const SyncLane: Lane =
    /*                        */
    0b0000000000000000000000000000010;
export const SyncLaneIndex: number = 1;
export const InputContinuousHydrationLane: Lane =
    /*    */
    0b0000000000000000000000000000100;
export const InputContinuousLane: Lane =
    /*             */
    0b0000000000000000000000000001000;
export const DefaultHydrationLane: Lane =
    /*            */
    0b0000000000000000000000000010000;
export const DefaultLane: Lane =
    /*                     */
    0b0000000000000000000000000100000;
export const SyncUpdateLanes: Lane = enableUnifiedSyncLane ? SyncLane | InputContinuousLane | DefaultLane : SyncLane;
export const TransitionHydrationLane: Lane =
    /*                */
    0b0000000000000000000000001000000;
export const TransitionLanes: Lanes =
    /*                       */
    0b0000000001111111111111110000000;
export const TransitionLane1: Lane =
    /*                        */
    0b0000000000000000000000010000000;
export const TransitionLane2: Lane =
    /*                        */
    0b0000000000000000000000100000000;
export const TransitionLane3: Lane =
    /*                        */
    0b0000000000000000000001000000000;
export const TransitionLane4: Lane =
    /*                        */
    0b0000000000000000000010000000000;
export const TransitionLane5: Lane =
    /*                        */
    0b0000000000000000000100000000000;
export const TransitionLane6: Lane =
    /*                        */
    0b0000000000000000001000000000000;
export const TransitionLane7: Lane =
    /*                        */
    0b0000000000000000010000000000000;
export const TransitionLane8: Lane =
    /*                        */
    0b0000000000000000100000000000000;
export const TransitionLane9: Lane =
    /*                        */
    0b0000000000000001000000000000000;
export const TransitionLane10: Lane =
    /*                       */
    0b0000000000000010000000000000000;
export const TransitionLane11: Lane =
    /*                       */
    0b0000000000000100000000000000000;
export const TransitionLane12: Lane =
    /*                       */
    0b0000000000001000000000000000000;
export const TransitionLane13: Lane =
    /*                       */
    0b0000000000010000000000000000000;
export const TransitionLane14: Lane =
    /*                       */
    0b0000000000100000000000000000000;
export const TransitionLane15: Lane =
    /*                       */
    0b0000000001000000000000000000000;
export const RetryLanes: Lanes =
    /*                            */
    0b0000011110000000000000000000000;
export const RetryLane1: Lane =
    /*                             */
    0b0000000010000000000000000000000;
export const RetryLane2: Lane =
    /*                             */
    0b0000000100000000000000000000000;
export const RetryLane3: Lane =
    /*                             */
    0b0000001000000000000000000000000;
export const RetryLane4: Lane =
    /*                             */
    0b0000010000000000000000000000000;
export const SomeRetryLane: Lane = RetryLane1;
export const SelectiveHydrationLane: Lane =
    /*          */
    0b0000100000000000000000000000000;
export const NonIdleLanes: Lanes =
    /*                          */
    0b0000111111111111111111111111111;
export const IdleHydrationLane: Lane =
    /*               */
    0b0001000000000000000000000000000;
export const IdleLane: Lane =
    /*                        */
    0b0010000000000000000000000000000;
export const OffscreenLane: Lane =
    /*                   */
    0b0100000000000000000000000000000;
export const DeferredLane: Lane =
    /*                    */
    0b1000000000000000000000000000000;
// Any lane that might schedule an update. This is used to detect infinite
// update loops, so it doesn't include hydration lanes or retries.
export const UpdateLanes: Lanes = SyncLane | InputContinuousLane | DefaultLane | TransitionLanes;
// This function is used for the experimental timeline (react-devtools-timeline)
// It should be kept in sync with the Lanes values above.
export function getLabelForLane( lane: Lane ): string | void {
    if ( enableSchedulingProfiler ) {
        if ( lane & SyncHydrationLane ) {
            return "SyncHydrationLane";
        }

        if ( lane & SyncLane ) {
            return "Sync";
        }

        if ( lane & InputContinuousHydrationLane ) {
            return "InputContinuousHydration";
        }

        if ( lane & InputContinuousLane ) {
            return "InputContinuous";
        }

        if ( lane & DefaultHydrationLane ) {
            return "DefaultHydration";
        }

        if ( lane & DefaultLane ) {
            return "Default";
        }

        if ( lane & TransitionHydrationLane ) {
            return "TransitionHydration";
        }

        if ( lane & TransitionLanes ) {
            return "Transition";
        }

        if ( lane & RetryLanes ) {
            return "Retry";
        }

        if ( lane & SelectiveHydrationLane ) {
            return "SelectiveHydration";
        }

        if ( lane & IdleHydrationLane ) {
            return "IdleHydration";
        }

        if ( lane & IdleLane ) {
            return "Idle";
        }

        if ( lane & OffscreenLane ) {
            return "Offscreen";
        }

        if ( lane & DeferredLane ) {
            return "Deferred";
        }
    }
}

export function getHighestPriorityLane( lanes: Lanes ): Lane {
    return lanes & -lanes;
}

export function getHighestPriorityLanes( lanes: Lanes | Lane ): Lanes {
    if ( enableUnifiedSyncLane ) {
        const pendingSyncLanes = lanes & SyncUpdateLanes;

        if ( pendingSyncLanes !== 0 ) {
            return pendingSyncLanes;
        }
    }

    switch ( getHighestPriorityLane( lanes ) ) {
        case SyncHydrationLane:
            return SyncHydrationLane;

        case SyncLane:
            return SyncLane;

        case InputContinuousHydrationLane:
            return InputContinuousHydrationLane;

        case InputContinuousLane:
            return InputContinuousLane;

        case DefaultHydrationLane:
            return DefaultHydrationLane;

        case DefaultLane:
            return DefaultLane;

        case TransitionHydrationLane:
            return TransitionHydrationLane;

        case TransitionLane1:
        case TransitionLane2:
        case TransitionLane3:
        case TransitionLane4:
        case TransitionLane5:
        case TransitionLane6:
        case TransitionLane7:
        case TransitionLane8:
        case TransitionLane9:
        case TransitionLane10:
        case TransitionLane11:
        case TransitionLane12:
        case TransitionLane13:
        case TransitionLane14:
        case TransitionLane15:
            return lanes & TransitionLanes;

        case RetryLane1:
        case RetryLane2:
        case RetryLane3:
        case RetryLane4:
            return lanes & RetryLanes;

        case SelectiveHydrationLane:
            return SelectiveHydrationLane;

        case IdleHydrationLane:
            return IdleHydrationLane;

        case IdleLane:
            return IdleLane;

        case OffscreenLane:
            return OffscreenLane;

        case DeferredLane:
            // This shouldn't be reachable because deferred work is always entangled
            // with something else.
            return NoLanes;

        default:
            if ( __DEV__ ) {
                console.error( "Should have found matching lanes. This is a bug in React." );
            }

            // This shouldn't be reachable, but as a fallback, return the entire bitmask.
            return lanes;
    }
}

export function includesSyncLane( lanes: Lanes ): boolean {
    return ( lanes & ( SyncLane | SyncHydrationLane ) ) !== NoLanes;
}

export function includesNonIdleWork( lanes: Lanes ): boolean {
    return ( lanes & NonIdleLanes ) !== NoLanes;
}

export function includesOnlyRetries( lanes: Lanes ): boolean {
    return ( lanes & RetryLanes ) === lanes;
}

export function includesOnlyNonUrgentLanes( lanes: Lanes ): boolean {
    // TODO: Should hydration lanes be included here? This function is only
    // used in `updateDeferredValueImpl`.
    const UrgentLanes = SyncLane | InputContinuousLane | DefaultLane;
    return ( lanes & UrgentLanes ) === NoLanes;
}

export function includesOnlyTransitions( lanes: Lanes ): boolean {
    return ( lanes & TransitionLanes ) === lanes;
}

export function includesBlockingLane( root: FiberRoot, lanes: Lanes ): boolean {
    if ( allowConcurrentByDefault && ( root.current.mode & TypeOfMode.ConcurrentUpdatesByDefaultMode ) !== TypeOfMode.NoMode ) {
        // Concurrent updates by default always use time slicing.
        return false;
    }

    const SyncDefaultLanes = InputContinuousHydrationLane | InputContinuousLane | DefaultHydrationLane | DefaultLane;
    return ( lanes & SyncDefaultLanes ) !== NoLanes;
}

export function includesExpiredLane( root: FiberRoot, lanes: Lanes ): boolean {
    // This is a separate check from includesBlockingLane because a lane can
    // expire after a render has already started.
    return ( lanes & root.expiredLanes ) !== NoLanes;
}

export function isTransitionLane( lane: Lane ): boolean {
    return ( lane & TransitionLanes ) !== NoLanes;
}
