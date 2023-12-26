import { includesNonIdleWork } from "@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants";

import {
    getWorkInProgressDeferredLane, getWorkInProgressRootConcurrentErrors,
    getWorkInProgressRootExitStatus,
    getWorkInProgressRootInterleavedUpdatedLanes,
    getWorkInProgressRootRenderLanes,
    getWorkInProgressRootSafe,
    getWorkInProgressRootSkippedLanes,
    hasWorkInProgressRoot, pushWorkInProgressRootConcurrentError, setWorkInProgressRootConcurrentErrors,
    setWorkInProgressRootExitStatus
} from "@zenflux/react-reconciler/src/react-fiber-work-in-progress";
import { RootExitStatus } from "@zenflux/react-reconciler/src/root-exit-status";
import { markRootSuspended } from "@zenflux/react-reconciler/src/react-fiber-lane-mark-root";

import type { CapturedValue } from "@zenflux/react-reconciler/src/react-captured-value";

export function renderDidSuspend(): void {
    if ( getWorkInProgressRootExitStatus() === RootExitStatus.RootInProgress ) {
        setWorkInProgressRootExitStatus( RootExitStatus.RootSuspended );
    }
}

export function renderDidSuspendDelayIfPossible(): void {
    setWorkInProgressRootExitStatus( RootExitStatus.RootSuspendedWithDelay );

    // Check if there are updates that we skipped tree that might have unblocked
    // this render.
    if ( (
            includesNonIdleWork( getWorkInProgressRootSkippedLanes() ) ||
            includesNonIdleWork( getWorkInProgressRootInterleavedUpdatedLanes() ) )
        && hasWorkInProgressRoot()
    ) {
        // Mark the current render as suspended so that we switch to working on
        // the updates that were skipped. Usually we only suspend at the end of
        // the render phase.
        // TODO: We should probably always mark the root as suspended immediately
        // (inside this function), since by suspending at the end of the render
        // phase introduces a potential mistake where we suspend lanes that were
        // pinged or updated while we were rendering.
        // TODO: Consider unwinding immediately, using the
        // SuspendedOnHydration mechanism.
        markRootSuspended(
            getWorkInProgressRootSafe(),
            getWorkInProgressRootRenderLanes(),
            getWorkInProgressDeferredLane()
        );
    }
}

export function renderDidError( error: CapturedValue<unknown> ) {
    if ( getWorkInProgressRootExitStatus() !== RootExitStatus.RootSuspendedWithDelay ) {
        setWorkInProgressRootExitStatus( RootExitStatus.RootErrored );
    }

    if ( getWorkInProgressRootConcurrentErrors() === null ) {
        setWorkInProgressRootConcurrentErrors( [ error ] );
    } else {
        pushWorkInProgressRootConcurrentError( error );
    }
}
