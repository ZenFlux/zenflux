import { NoLane, NoLanes } from "@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants";

import { getEntangledLanes, setEntangledRenderLanes } from "@zenflux/react-reconciler/src/react-entangled-lane";

import {
    setWorkInProgress,
    setWorkInProgressDeferredLane,
    setWorkInProgressRoot,
    setWorkInProgressRootConcurrentErrors,
    setWorkInProgressRootDidAttachPingListener,
    setWorkInProgressRootExitStatus,
    setWorkInProgressRootFatalError,
    setWorkInProgressRootInterleavedUpdatedLanes,
    setWorkInProgressRootPingedLanes,
    setWorkInProgressRootRecoverableErrors,
    setWorkInProgressRootRenderLanes,
    setWorkInProgressRootRenderPhaseUpdatedLanes,
    setWorkInProgressRootSkippedLanes,
    setWorkInProgressSuspendedReason,
    setWorkInProgressThrownValue
} from "@zenflux/react-reconciler/src/react-fiber-work-in-progress";
import { SuspendedReason } from "@zenflux/react-reconciler/src/react-suspended-reason";
import { RootExitStatus } from "@zenflux/react-reconciler/src/root-exit-status";
import { finishQueueingConcurrentUpdates } from "@zenflux/react-reconciler/src/react-fiber-concurrent-updates";
import ReactStrictModeWarnings from "@zenflux/react-reconciler/src/react-strict-mode-warnings";
import { createWorkInProgress, resetWorkInProgressStack } from "@zenflux/react-reconciler/src/react-fiber-work-in-progress-ex";

import type { Fiber, FiberRoot, Lanes } from "@zenflux/react-shared/src/react-internal-types";

const {
    noTimeout,
    cancelTimeout,
} = globalThis.__RECONCILER__CONFIG__;

export function prepareWorkInProgressFreshStack( root: FiberRoot, lanes: Lanes ): Fiber {
    // Original name: `prepareFreshStack`

    root.finishedWork = null;
    root.finishedLanes = NoLanes;
    const timeoutHandle = root.timeoutHandle;

    if ( timeoutHandle !== noTimeout ) {
        // The root previous suspended and scheduled a timeout to commit a fallback
        // state. Now we have additional work, cancel the timeout.
        root.timeoutHandle = noTimeout;
        // $FlowFixMe[incompatible-call] Complains noTimeout is not a TimeoutID, despite the check above
        cancelTimeout( timeoutHandle );
    }

    const cancelPendingCommit = root.cancelPendingCommit;

    if ( cancelPendingCommit !== null ) {
        root.cancelPendingCommit = null;
        cancelPendingCommit();
    }

    resetWorkInProgressStack();

    setWorkInProgressRoot( root );

    const rootWorkInProgress = createWorkInProgress( root.current, null );

    setWorkInProgress( rootWorkInProgress );
    setWorkInProgressRootRenderLanes( lanes );
    setWorkInProgressSuspendedReason( SuspendedReason.NotSuspended );
    setWorkInProgressThrownValue( null );
    setWorkInProgressRootDidAttachPingListener( false );
    setWorkInProgressRootExitStatus( RootExitStatus.RootInProgress );
    setWorkInProgressRootFatalError( null );
    setWorkInProgressRootSkippedLanes( NoLanes );
    setWorkInProgressRootInterleavedUpdatedLanes( NoLanes );
    setWorkInProgressRootRenderPhaseUpdatedLanes( NoLanes );
    setWorkInProgressRootPingedLanes( NoLanes );
    setWorkInProgressDeferredLane( NoLane );
    setWorkInProgressRootConcurrentErrors( null );
    setWorkInProgressRootRecoverableErrors( null );
    // Get the lanes that are entangled with whatever we're about to render. We
    // track these separately so we can distinguish the priority of the render
    // task from the priority of the lanes it is entangled with. For example, a
    // transition may not be allowed to finish unless it includes the Sync lane,
    // which is currently suspended. We should be able to render the Transition
    // and Sync lane in the same batch, but at Transition priority, because the
    // Sync lane already suspended.
    setEntangledRenderLanes( getEntangledLanes( root, lanes ) );

    finishQueueingConcurrentUpdates();

    if ( __DEV__ ) {
        ReactStrictModeWarnings.discardPendingWarnings();
    }

    return rootWorkInProgress;
}
