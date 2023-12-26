
import {
    DeferredLane,
    IdleLane, NoLane, NoLanes, OffscreenLane,
    UpdateLanes
} from "@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants";

import {
    getWorkInProgressRootInterleavedUpdatedLanes,
    getWorkInProgressRootPingedLanes
} from "@zenflux/react-reconciler/src/react-fiber-work-in-progress";
import {
    NoTimestamp,
    pickArbitraryLaneIndex,
    removeLanes,
} from "@zenflux/react-reconciler/src/react-fiber-lane";

import type { FiberRoot, Lane, Lanes } from "@zenflux/react-shared/src/react-internal-types";

function markSpawnedDeferredLane( root: FiberRoot, spawnedLane: Lane, entangledLanes: Lanes ) {
    // This render spawned a deferred task. Mark it as pending.
    root.pendingLanes |= spawnedLane;
    root.suspendedLanes &= ~spawnedLane;
    // Entangle the spawned lane with the DeferredLane bit so that we know it
    // was the result of another render. This lets us avoid a useDeferredValue
    // waterfall — only the first level will defer.
    const spawnedLaneIndex = pickArbitraryLaneIndex( spawnedLane );
    root.entangledLanes |= spawnedLane;
    root.entanglements[ spawnedLaneIndex ] |= DeferredLane | // If the parent render task suspended, we must also entangle those lanes
        // with the spawned task, so that the deferred task includes all the same
        // updates that the parent task did. We can exclude any lane that is not
        // used for updates (e.g. Offscreen).
        entangledLanes & UpdateLanes;
}

export function markRootUpdated( root: FiberRoot, updateLane: Lane ) {
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
    if ( updateLane !== IdleLane ) {
        root.suspendedLanes = NoLanes;
        root.pingedLanes = NoLanes;
    }
}

export function markRootSuspended( root: FiberRoot, suspendedLanes: Lanes, spawnedLane: Lane ) {
    // When suspending, we should always exclude lanes that were pinged or (more
    // rarely, since we try to avoid it) updated during the render phase.
    // TODO: Lol maybe there's a better way to factor this besides this
    // obnoxiously named function :)
    suspendedLanes = removeLanes( suspendedLanes, getWorkInProgressRootPingedLanes() );
    suspendedLanes = removeLanes( suspendedLanes, getWorkInProgressRootInterleavedUpdatedLanes() );
    markRootSuspendedInternal( root, suspendedLanes, spawnedLane );
}

export function markRootSuspendedInternal( root: FiberRoot, suspendedLanes: Lanes, spawnedLane: Lane ) {
    root.suspendedLanes |= suspendedLanes;
    root.pingedLanes &= ~suspendedLanes;
    // The suspended lanes are no longer CPU-bound. Clear their expiration times.
    const expirationTimes = root.expirationTimes;
    let lanes = suspendedLanes;

    while ( lanes > 0 ) {
        const index = pickArbitraryLaneIndex( lanes );
        const lane = 1 << index;
        expirationTimes[ index ] = NoTimestamp;
        lanes &= ~lane;
    }

    if ( spawnedLane !== NoLane ) {
        markSpawnedDeferredLane( root, spawnedLane, suspendedLanes );
    }
}

export function markRootPinged( root: FiberRoot, pingedLanes: Lanes ) {
    root.pingedLanes |= root.suspendedLanes & pingedLanes;
}

export function markRootFinished( root: FiberRoot, remainingLanes: Lanes, spawnedLane: Lane ) {
    const noLongerPendingLanes = root.pendingLanes & ~remainingLanes;
    root.pendingLanes = remainingLanes;
    // Let's try everything again
    root.suspendedLanes = NoLanes;
    root.pingedLanes = NoLanes;
    root.expiredLanes &= remainingLanes;
    root.entangledLanes &= remainingLanes;
    root.errorRecoveryDisabledLanes &= remainingLanes;
    root.shellSuspendCounter = 0;
    const entanglements = root.entanglements;
    const expirationTimes = root.expirationTimes;
    const hiddenUpdates = root.hiddenUpdates;
    // Clear the lanes that no longer have pending work
    let lanes = noLongerPendingLanes;

    while ( lanes > 0 ) {
        const index = pickArbitraryLaneIndex( lanes );
        const lane = 1 << index;
        entanglements[ index ] = NoLanes;
        expirationTimes[ index ] = NoTimestamp;
        const hiddenUpdatesForLane = hiddenUpdates[ index ];

        if ( hiddenUpdatesForLane !== null ) {
            hiddenUpdates[ index ] = null;

            // "Hidden" updates are updates that were made to a hidden component. They
            // have special logic associated with them because they may be entangled
            // with updates that occur outside that tree. But once the outer tree
            // commits, they behave like regular updates.
            for ( let i = 0 ; i < hiddenUpdatesForLane.length ; i++ ) {
                const update = hiddenUpdatesForLane[ i ];

                if ( update !== null ) {
                    update.lane &= ~OffscreenLane;
                }
            }
        }

        lanes &= ~lane;
    }

    if ( spawnedLane !== NoLane ) {
        markSpawnedDeferredLane( root, spawnedLane, // This render finished successfully without suspending, so we don't need
            // to entangle the spawned task with the parent task.
            NoLanes );
    }
}
