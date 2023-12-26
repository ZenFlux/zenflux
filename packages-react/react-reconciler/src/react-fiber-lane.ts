import {
    enableTransitionTracing,
    enableUnifiedSyncLane,
    enableUpdaterTracking
} from "@zenflux/react-shared/src/react-feature-flags";

import {
    DefaultHydrationLane,
    DefaultLane,
    DeferredLane,
    getHighestPriorityLane,
    getHighestPriorityLanes,
    IdleHydrationLane,
    IdleLane,
    InputContinuousHydrationLane,
    InputContinuousLane,
    NoLane,
    NoLanes,
    NonIdleLanes,
    OffscreenLane,
    RetryLane1,
    RetryLane2,
    RetryLane3,
    RetryLane4,
    RetryLanes,
    SelectiveHydrationLane,
    SyncHydrationLane,
    SyncLane,
    SyncLaneIndex,
    SyncUpdateLanes,
    TotalLanes,
    TransitionHydrationLane,
    TransitionLane1,
    TransitionLane10,
    TransitionLane11,
    TransitionLane12,
    TransitionLane13,
    TransitionLane14,
    TransitionLane15,
    TransitionLane2,
    TransitionLane3,
    TransitionLane4,
    TransitionLane5,
    TransitionLane6,
    TransitionLane7,
    TransitionLane8,
    TransitionLane9,
    TransitionLanes
} from "@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants";

import { clz32 } from "@zenflux/react-reconciler/src/clz32";

import { isDevToolsPresent } from "@zenflux/react-reconciler/src/react-fiber-dev-tools-hook";

import type { Transition } from "@zenflux/react-shared/src/react-internal-types/transition";
import type { ConcurrentUpdate } from "@zenflux/react-shared/src/react-internal-types/update";
import type { LaneMap } from "@zenflux/react-shared/src/react-internal-types/lanes";

import type { Fiber, FiberRoot, Lane, Lanes } from "@zenflux/react-shared/src/react-internal-types";

export const NoTimestamp = -1;
let nextTransitionLane: Lane = TransitionLane1;
let nextRetryLane: Lane = RetryLane1;

export function getNextLanes( root: FiberRoot, wipLanes: Lanes ): Lanes {
    // Early bailout if there's no pending work left.
    const pendingLanes = root.pendingLanes;

    if ( pendingLanes === NoLanes ) {
        return NoLanes;
    }

    let nextLanes = NoLanes;
    const suspendedLanes = root.suspendedLanes;
    const pingedLanes = root.pingedLanes;
    // Do not work on any idle work until all the non-idle work has finished,
    // even if the work is suspended.
    const nonIdlePendingLanes = pendingLanes & NonIdleLanes;

    if ( nonIdlePendingLanes !== NoLanes ) {
        const nonIdleUnblockedLanes = nonIdlePendingLanes & ~suspendedLanes;

        if ( nonIdleUnblockedLanes !== NoLanes ) {
            nextLanes = getHighestPriorityLanes( nonIdleUnblockedLanes );
        } else {
            const nonIdlePingedLanes = nonIdlePendingLanes & pingedLanes;

            if ( nonIdlePingedLanes !== NoLanes ) {
                nextLanes = getHighestPriorityLanes( nonIdlePingedLanes );
            }
        }
    } else {
        // The only remaining work is Idle.
        const unblockedLanes = pendingLanes & ~suspendedLanes;

        if ( unblockedLanes !== NoLanes ) {
            nextLanes = getHighestPriorityLanes( unblockedLanes );
        } else {
            if ( pingedLanes !== NoLanes ) {
                nextLanes = getHighestPriorityLanes( pingedLanes );
            }
        }
    }

    if ( nextLanes === NoLanes ) {
        // This should only be reachable if we're suspended
        // TODO: Consider warning in this path if a fallback timer is not scheduled.
        return NoLanes;
    }

    // If we're already in the middle of a render, switching lanes will interrupt
    // it and we'll lose our progress. We should only do this if the new lanes are
    // higher priority.
    if ( wipLanes !== NoLanes && wipLanes !== nextLanes && // If we already suspended with a delay, then interrupting is fine. Don't
        // bother waiting until the root is complete.
        ( wipLanes & suspendedLanes ) === NoLanes ) {
        const nextLane = getHighestPriorityLane( nextLanes );
        const wipLane = getHighestPriorityLane( wipLanes );

        if ( // Tests whether the next lane is equal or lower priority than the wip
            // one. This works because the bits decrease in priority as you go left.
            nextLane >= wipLane || // Default priority updates should not interrupt transition updates. The
            // only difference between default updates and transition updates is that
            // default updates do not support refresh transitions.
            nextLane === DefaultLane && ( wipLane & TransitionLanes ) !== NoLanes ) {
            // Keep working on the existing in-progress tree. Do not interrupt.
            return wipLanes;
        }
    }

    return nextLanes;
}

function computeExpirationTime( lane: Lane, currentTime: number ) {
    switch ( lane ) {
        case SyncHydrationLane:
        case SyncLane:
        case InputContinuousHydrationLane:
        case InputContinuousLane:
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

        case DefaultHydrationLane:
        case DefaultLane:
        case TransitionHydrationLane:
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
            return currentTime + 5000;

        case RetryLane1:
        case RetryLane2:
        case RetryLane3:
        case RetryLane4:
            // TODO: Retries should be allowed to expire if they are CPU bound for
            // too long, but when I made this change it caused a spike in browser
            // crashes. There must be some other underlying bug; not super urgent but
            // ideally should figure out why and fix it. Unfortunately we don't have
            // a repro for the crashes, only detected via production metrics.
            return NoTimestamp;

        case SelectiveHydrationLane:
        case IdleHydrationLane:
        case IdleLane:
        case OffscreenLane:
        case DeferredLane:
            // Anything idle priority or lower should never expire.
            return NoTimestamp;

        default:
            if ( __DEV__ ) {
                console.error( "Should have found matching lanes. This is a bug in React." );
            }

            return NoTimestamp;
    }
}

export function markStarvedLanesAsExpired( root: FiberRoot, currentTime: number ): void {
    // TODO: This gets called every time we yield. We can optimize by storing
    // the earliest expiration time on the root. Then use that to quickly bail out
    // of this function.
    const pendingLanes = root.pendingLanes;
    const suspendedLanes = root.suspendedLanes;
    const pingedLanes = root.pingedLanes;
    const expirationTimes = root.expirationTimes;
    // Iterate through the pending lanes and check if we've reached their
    // expiration time. If so, we'll assume the update is being starved and mark
    // it as expired to force it to finish.
    // TODO: We should be able to replace this with upgradePendingLanesToSync
    //
    // We exclude retry lanes because those must always be time sliced, in order
    // to unwrap uncached promises.
    // TODO: Write a test for this
    let lanes = pendingLanes & ~RetryLanes;

    while ( lanes > 0 ) {
        const index = pickArbitraryLaneIndex( lanes );
        const lane = 1 << index;
        const expirationTime = expirationTimes[ index ];

        if ( expirationTime === NoTimestamp ) {
            // Found a pending lane with no expiration time. If it's not suspended, or
            // if it's pinged, assume it's CPU-bound. Compute a new expiration time
            // using the current time.
            if ( ( lane & suspendedLanes ) === NoLanes || ( lane & pingedLanes ) !== NoLanes ) {
                // Assumes timestamps are monotonically increasing.
                expirationTimes[ index ] = computeExpirationTime( lane, currentTime );
            }
        } else if ( expirationTime <= currentTime ) {
            // This lane expired
            root.expiredLanes |= lane;
        }

        lanes &= ~lane;
    }
}

// This returns the highest priority pending lanes regardless of whether they
// are suspended.
export function getHighestPriorityPendingLanes( root: FiberRoot ): Lanes {
    return getHighestPriorityLanes( root.pendingLanes );
}

export function getLanesToRetrySynchronouslyOnError( root: FiberRoot, originallyAttemptedLanes: Lanes ): Lanes {
    if ( root.errorRecoveryDisabledLanes & originallyAttemptedLanes ) {
        // The error recovery mechanism is disabled until these lanes are cleared.
        return NoLanes;
    }

    const everythingButOffscreen = root.pendingLanes & ~OffscreenLane;

    if ( everythingButOffscreen !== NoLanes ) {
        return everythingButOffscreen;
    }

    if ( everythingButOffscreen & OffscreenLane ) {
        return OffscreenLane;
    }

    return NoLanes;
}

export function claimNextTransitionLane(): Lane {
    // Cycle through the lanes, assigning each new transition to the next lane.
    // In most cases, this means every transition gets its own lane, until we
    // run out of lanes and cycle back to the beginning.
    const lane = nextTransitionLane;
    nextTransitionLane <<= 1;

    if ( ( nextTransitionLane & TransitionLanes ) === NoLanes ) {
        nextTransitionLane = TransitionLane1;
    }

    return lane;
}

export function claimNextRetryLane(): Lane {
    const lane = nextRetryLane;
    nextRetryLane <<= 1;

    if ( ( nextRetryLane & RetryLanes ) === NoLanes ) {
        nextRetryLane = RetryLane1;
    }

    return lane;
}

export function pickArbitraryLane( lanes: Lanes ): Lane {
    // This wrapper function gets inlined. Only exists so to communicate that it
    // doesn't matter which bit is selected; you can pick any bit without
    // affecting the algorithms where its used. Here I'm using
    // getHighestPriorityLane because it requires the fewest operations.
    return getHighestPriorityLane( lanes );
}

export function pickArbitraryLaneIndex( lanes: Lanes ) {
    return 31 - clz32( lanes );
}

export function includesSomeLane( a: Lanes | Lane, b: Lanes | Lane ): boolean {
    return ( a & b ) !== NoLanes;
}

export function isSubsetOfLanes( set: Lanes, subset: Lanes | Lane ): boolean {
    return ( set & subset ) === subset;
}

export function mergeLanes( a: Lanes | Lane, b: Lanes | Lane ): Lanes {
    return a | b;
}

export function removeLanes( set: Lanes, subset: Lanes | Lane ): Lanes {
    return set & ~subset;
}

export function intersectLanes( a: Lanes | Lane, b: Lanes | Lane ): Lanes {
    return a & b;
}

// Seems redundant, but it changes the type from a single lane (used for
// updates) to a group of lanes (used for flushing work).
export function laneToLanes( lane: Lane ): Lanes {
    return lane;
}

export function higherPriorityLane( a: Lane, b: Lane ): Lane {
    // This works because the bit ranges decrease in priority as you go left.
    return a !== NoLane && a < b ? a : b;
}

export function createLaneMap<T>( initial: T ): LaneMap<T> {
    // Intentionally pushing one by one.
    // https://v8.dev/blog/elements-kinds#avoid-creating-holes
    const laneMap: T[] = [];

    for ( let i = 0 ; i < TotalLanes ; i++ ) {
        laneMap.push( initial );
    }

    return laneMap;
}

export function upgradePendingLaneToSync( root: FiberRoot, lane: Lane ) {
    // Since we're upgrading the priority of the given lane, there is now pending
    // sync work.
    root.pendingLanes |= SyncLane;
    // Entangle the sync lane with the lane we're upgrading. This means SyncLane
    // will not be allowed to finish without also finishing the given lane.
    root.entangledLanes |= SyncLane;
    root.entanglements[ SyncLaneIndex ] |= lane;
}

export function upgradePendingLanesToSync( root: FiberRoot, lanesToUpgrade: Lanes ) {
    // Same as upgradePendingLaneToSync but accepts multiple lanes, so it's a
    // bit slower.
    root.pendingLanes |= SyncLane;
    root.entangledLanes |= SyncLane;
    let lanes = lanesToUpgrade;

    while ( lanes ) {
        const index = pickArbitraryLaneIndex( lanes );
        const lane = 1 << index;
        root.entanglements[ SyncLaneIndex ] |= lane;
        lanes &= ~lane;
    }
}

export function markHiddenUpdate( root: FiberRoot, update: ConcurrentUpdate, lane: Lane ) {
    const index = pickArbitraryLaneIndex( lane );
    const hiddenUpdates = root.hiddenUpdates;
    const hiddenUpdatesForLane = hiddenUpdates[ index ];

    if ( hiddenUpdatesForLane === null ) {
        hiddenUpdates[ index ] = [ update ];
    } else {
        hiddenUpdatesForLane.push( update );
    }

    update.lane = lane | OffscreenLane;
}

export function getBumpedLaneForHydration( root: FiberRoot, renderLanes: Lanes ): Lane {
    const renderLane = getHighestPriorityLane( renderLanes );
    let lane;

    if ( enableUnifiedSyncLane && ( renderLane & SyncUpdateLanes ) !== NoLane ) {
        lane = SyncHydrationLane;
    } else {
        switch ( renderLane ) {
            case SyncLane:
                lane = SyncHydrationLane;
                break;

            case InputContinuousLane:
                lane = InputContinuousHydrationLane;
                break;

            case DefaultLane:
                lane = DefaultHydrationLane;
                break;

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
            case RetryLane1:
            case RetryLane2:
            case RetryLane3:
            case RetryLane4:
                lane = TransitionHydrationLane;
                break;

            case IdleLane:
                lane = IdleHydrationLane;
                break;

            default:
                // Everything else is already either a hydration lane, or shouldn't
                // be retried at a hydration lane.
                lane = NoLane;
                break;
        }
    }

    // Check if the lane we chose is suspended. If so, that indicates that we
    // already attempted and failed to hydrate at that level. Also check if we're
    // already rendering that lane, which is rare but could happen.
    if ( ( lane & ( root.suspendedLanes | renderLanes ) ) !== NoLane ) {
        // Give up trying to hydrate and fall back to client render.
        return NoLane;
    }

    return lane;
}

export function addFiberToLanesMap( root: FiberRoot, fiber: Fiber, lanes: Lanes | Lane ) {
    if ( ! enableUpdaterTracking ) {
        return;
    }

    if ( ! isDevToolsPresent ) {
        return;
    }

    const pendingUpdatersLaneMap = root.pendingUpdatersLaneMap;

    while ( lanes > 0 ) {
        const index = pickArbitraryLaneIndex( lanes );
        const lane = 1 << index;
        const updaters = pendingUpdatersLaneMap[ index ];
        updaters.add( fiber );
        lanes &= ~lane;
    }
}

export function movePendingFibersToMemoized( root: FiberRoot, lanes: Lanes ) {
    if ( ! enableUpdaterTracking ) {
        return;
    }

    if ( ! isDevToolsPresent ) {
        return;
    }

    const pendingUpdatersLaneMap = root.pendingUpdatersLaneMap;
    const memoizedUpdaters = root.memoizedUpdaters;

    while ( lanes > 0 ) {
        const index = pickArbitraryLaneIndex( lanes );
        const lane = 1 << index;
        const updaters = pendingUpdatersLaneMap[ index ];

        if ( updaters.size > 0 ) {
            updaters.forEach( ( fiber: Fiber ) => {
                const alternate = fiber.alternate;

                if ( alternate === null || ! memoizedUpdaters.has( alternate ) ) {
                    memoizedUpdaters.add( fiber );
                }
            } );
            updaters.clear();
        }

        lanes &= ~lane;
    }
}

export function addTransitionToLanesMap( root: FiberRoot, transition: Transition, lane: Lane ) {
    if ( enableTransitionTracing ) {
        const transitionLanesMap = root.transitionLanes;
        const index = pickArbitraryLaneIndex( lane );
        let transitions = transitionLanesMap[ index ];

        if ( transitions === null ) {
            transitions = new Set();
        }

        transitions.add( transition );
        transitionLanesMap[ index ] = transitions;
    }
}

export function getTransitionsForLanes( root: FiberRoot, lanes: Lane | Lanes ): Array<Transition> | null {
    if ( ! enableTransitionTracing ) {
        return null;
    }

    const transitionsForLanes: Transition[] | null = [];

    while ( lanes > 0 ) {
        const index = pickArbitraryLaneIndex( lanes );
        const lane = 1 << index;
        const transitions = root.transitionLanes[ index ];

        if ( transitions !== null ) {
            transitions.forEach( transition => {
                transitionsForLanes.push( transition );
            } );
        }

        lanes &= ~lane;
    }

    if ( transitionsForLanes.length === 0 ) {
        return null;
    }

    return transitionsForLanes;
}

export function clearTransitionsForLanes( root: FiberRoot, lanes: Lane | Lanes ) {
    if ( ! enableTransitionTracing ) {
        return;
    }

    while ( lanes > 0 ) {
        const index = pickArbitraryLaneIndex( lanes );
        const lane = 1 << index;
        const transitions = root.transitionLanes[ index ];

        if ( transitions !== null ) {
            root.transitionLanes[ index ] = null;
        }

        lanes &= ~lane;
    }
}
