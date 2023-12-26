import { OffscreenDetached } from "@zenflux/react-shared/src/react-internal-constants/offscreen";

import { FiberFlags } from "@zenflux/react-shared/src/react-internal-constants/fiber-flags";

import { SyncLane } from "@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants";

import { enqueueConcurrentRenderForLane } from "@zenflux/react-reconciler/src/react-fiber-concurrent-updates";
import { scheduleUpdateOnFiber } from "@zenflux/react-reconciler/src/react-fiber-work-schedule-update";

import type { OffscreenInstance } from "@zenflux/react-shared/src/react-internal-types/offscreen";

export function detachOffscreenInstance( instance: OffscreenInstance ): void {
    const fiber = instance._current;

    if ( fiber === null ) {
        throw new Error( "Calling Offscreen.detach before instance handle has been set." );
    }

    if ( ( instance._pendingVisibility & OffscreenDetached ) !== FiberFlags.NoFlags ) {
        // The instance is already detached, this is a noop.
        return;
    }

    // TODO: There is an opportunity to optimise this by not entering commit phase
    // and unmounting effects directly.
    const root = enqueueConcurrentRenderForLane( fiber, SyncLane );

    if ( root !== null ) {
        instance._pendingVisibility |= OffscreenDetached;
        scheduleUpdateOnFiber( root, fiber, SyncLane );
    }
}

export function attachOffscreenInstance( instance: OffscreenInstance ): void {
    const fiber = instance._current;

    if ( fiber === null ) {
        throw new Error( "Calling Offscreen.detach before instance handle has been set." );
    }

    if ( ( instance._pendingVisibility & OffscreenDetached ) === FiberFlags.NoFlags ) {
        // The instance is already attached, this is a noop.
        return;
    }

    const root = enqueueConcurrentRenderForLane( fiber, SyncLane );

    if ( root !== null ) {
        instance._pendingVisibility &= ~OffscreenDetached;
        scheduleUpdateOnFiber( root, fiber, SyncLane );
    }
}
