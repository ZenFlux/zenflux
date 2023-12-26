import { enableUpdaterTracking } from "@zenflux/react-shared/src/react-feature-flags";
import ReactSharedInternals from "@zenflux/react-shared/src/react-shared-internals";

import { includesOnlyRetries, NoLanes } from "@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants";

import { LegacyRoot } from "@zenflux/react-shared/src/react-internal-constants/root-tags";

import { isConcurrentActEnvironment } from "@zenflux/react-reconciler/src/react-fiber-act";

import { restorePendingUpdaters } from "@zenflux/react-reconciler/src/react-fiber-commit-work";
import { isDevToolsPresent } from "@zenflux/react-reconciler/src/react-fiber-dev-tools-hook";
import { isSubsetOfLanes, mergeLanes } from "@zenflux/react-reconciler/src/react-fiber-lane";
import { markRootPinged } from "@zenflux/react-reconciler/src/react-fiber-lane-mark-root";
import { ReactFiberRootSchedulerShared } from "@zenflux/react-reconciler/src/react-fiber-root-scheduler-shared";
import { isExecutionContextRenderActivate } from "@zenflux/react-reconciler/src/react-fiber-work-excution-context";
import {
    getWorkInProgressRoot,
    getWorkInProgressRootExitStatus, getWorkInProgressRootPingedLanes, getWorkInProgressRootRenderLanes,
    setWorkInProgressRootDidAttachPingListener, setWorkInProgressRootPingedLanes
} from "@zenflux/react-reconciler/src/react-fiber-work-in-progress";
import { prepareWorkInProgressFreshStack } from "@zenflux/react-reconciler/src/react-fiber-work-in-progress-prepare-fresh-stack";
import { isGlobalMostRecentFallbackNotExceeded } from "@zenflux/react-reconciler/src/react-fiber-work-most-recent-fallback-time";
import { RootExitStatus } from "@zenflux/react-reconciler/src/root-exit-status";

import type { FiberRoot, Lanes } from "@zenflux/react-shared/src/react-internal-types";
import type { Wakeable } from "@zenflux/react-shared/src/react-types";

const PossiblyWeakMap: WeakMapConstructor = typeof WeakMap === "function" ? WeakMap : Map;

const {
    ReactCurrentActQueue
} = ReactSharedInternals;

function warnIfSuspenseResolutionNotWrappedWithActDEV( root: FiberRoot ): void {
    if ( __DEV__ ) {
        if ( root.tag !== LegacyRoot && isConcurrentActEnvironment() && ReactCurrentActQueue.current === null ) {
            console.error( "A suspended resource finished loading inside a test, but the event " + "was not wrapped in act(...).\n\n" + "When testing, code that resolves suspended data should be wrapped " + "into act(...):\n\n" + "act(() => {\n" + "  /* finish loading suspended data */\n" + "});\n" + "/* assert on the output */\n\n" + "This ensures that you're testing the behavior the user would see " + "in the browser." + " Learn more at https://reactjs.org/link/wrap-tests-with-act" );
        }
    }
}
// Called during render to determine if anything has suspended.
// Returns false if we're not sure.
export function renderHasNotSuspendedYet(): boolean {
    // If something errored or completed, we can't really be sure,
    // so those are false.
    return getWorkInProgressRootExitStatus() === RootExitStatus.RootInProgress;
}

export function attachPingListener( root: FiberRoot, wakeable: Wakeable, lanes: Lanes ) {
    // Attach a ping listener
    //
    // The data might resolve before we have a chance to commit the fallback. Or,
    // in the case of a refresh, we'll never commit a fallback. So we need to
    // attach a listener now. When it resolves ("pings"), we can decide whether to
    // try rendering the tree again.
    //
    // Only attach a listener if one does not already exist for the lanes
    // we're currently rendering (which acts like a "thread ID" here).
    //
    // We only need to do this in concurrent mode. Legacy Suspense always
    // commits fallbacks synchronously, so there are no pings.
    let pingCache = root.pingCache;
    let threadIDs;

    if ( pingCache === null ) {
        pingCache = root.pingCache = new PossiblyWeakMap();
        threadIDs = new Set<unknown>();
        pingCache.set( wakeable, threadIDs );
    } else {
        threadIDs = pingCache.get( wakeable );

        if ( threadIDs === undefined ) {
            threadIDs = new Set();
            pingCache.set( wakeable, threadIDs );
        }
    }

    if ( ! threadIDs.has( lanes ) ) {
        setWorkInProgressRootDidAttachPingListener( true );
        // Memoize using the thread ID to prevent redundant listeners.
        threadIDs.add( lanes );
        const ping = pingSuspendedRoot.bind( null, root, wakeable, lanes );

        if ( enableUpdaterTracking ) {
            if ( isDevToolsPresent ) {
                // If we have pending work still, restore the original updaters
                restorePendingUpdaters( root, lanes );
            }
        }

        wakeable.then( ping, ping );
    }
}

function pingSuspendedRoot( root: FiberRoot, wakeable: Wakeable, pingedLanes: Lanes ) {
    const pingCache = root.pingCache;

    if ( pingCache !== null ) {
        // The wake-able resolved, so we no longer need to memoize, because it will
        // never be thrown again.
        pingCache.delete( wakeable );
    }

    markRootPinged( root, pingedLanes );
    warnIfSuspenseResolutionNotWrappedWithActDEV( root );

    if ( getWorkInProgressRoot() === root && isSubsetOfLanes( getWorkInProgressRootRenderLanes(), pingedLanes ) ) {
        // Received a ping at the same priority level at which we're currently
        // rendering. We might want to restart this render. This should mirror
        // the logic of whether or not a root suspends once it completes.
        // TODO: If we're rendering sync either due to Sync, Batched or expired,
        // we should probably never restart.
        // If we're suspended with delay, or if it's a retry, we'll always suspend
        // so we can always restart.
        if (
            getWorkInProgressRootExitStatus() === RootExitStatus.RootSuspendedWithDelay ||
            getWorkInProgressRootExitStatus() === RootExitStatus.RootSuspended &&
            includesOnlyRetries( getWorkInProgressRootRenderLanes() ) && isGlobalMostRecentFallbackNotExceeded()
        ) {
            // Force a restart from the root by unwinding the stack. Unless this is
            // being called from the render phase, because that would cause a crash.
            if ( isExecutionContextRenderActivate() ) {
                prepareWorkInProgressFreshStack( root, NoLanes );
            } else {// TODO: If this does happen during the render phase, we should throw
                // the special internal exception that we use to interrupt the stack for
                // selective hydration. That was temporarily reverted but we once we add
                // it back we can use it here.
            }
        } else {
            // Even though we can't restart right now, we might get an
            // opportunity later. So we mark this render as having a ping.
            setWorkInProgressRootPingedLanes( mergeLanes( getWorkInProgressRootPingedLanes(), pingedLanes ) );
        }
    }

    ReactFiberRootSchedulerShared.ensureRootScheduled( root );
}
