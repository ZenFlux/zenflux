import {
    enableDebugTracing,
    enableSchedulingProfiler,
    enableUpdaterTracking
} from "@zenflux/react-shared/src/react-feature-flags";

import { NoLanes } from "@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants";

import { logRenderStarted, logRenderStopped } from "@zenflux/react-reconciler/src/react-debug-tracing";
import { restorePendingUpdaters } from "@zenflux/react-reconciler/src/react-fiber-commit-work";
import { finishQueueingConcurrentUpdates } from "@zenflux/react-reconciler/src/react-fiber-concurrent-updates";
import {
    isDevToolsPresent,
    markRenderStarted,
    markRenderStopped
} from "@zenflux/react-reconciler/src/react-fiber-dev-tools-hook";
import { getTransitionsForLanes, movePendingFibersToMemoized } from "@zenflux/react-reconciler/src/react-fiber-lane";
import { resetContextDependencies } from "@zenflux/react-reconciler/src/react-fiber-new-context";
import { getSuspenseHandler } from "@zenflux/react-reconciler/src/react-fiber-suspense-context";
import {
    activateRenderExecutionContext,
    getExecutionContext,
    setExecutionContext
} from "@zenflux/react-reconciler/src/react-fiber-work-excution-context";

import {
    getWorkInProgress,
    getWorkInProgressRoot,
    getWorkInProgressRootExitStatus,
    getWorkInProgressRootRenderLanes,
    getWorkInProgressSafe,
    getWorkInProgressSuspendedReason,
    getWorkInProgressThrownValue,
    setWorkInProgressRoot,
    setWorkInProgressRootExitStatus,
    setWorkInProgressRootRenderLanes,
    setWorkInProgressSuspendedReason,
    setWorkInProgressThrownValue,
    setWorkInProgressTransitions
} from "@zenflux/react-reconciler/src/react-fiber-work-in-progress";
import { resetWorkInProgressStack } from "@zenflux/react-reconciler/src/react-fiber-work-in-progress-ex";
import {
    prepareWorkInProgressFreshStack
} from "@zenflux/react-reconciler/src/react-fiber-work-in-progress-prepare-fresh-stack";
import {
    popCacheDispatcher,
    popDispatcher,
    pushCacheDispatcher,
    pushDispatcher
} from "@zenflux/react-reconciler/src/react-fiber-work-on-root-dispatcher";
import { handleThrow } from "@zenflux/react-reconciler/src/react-fiber-work-on-root-handle-throw";
import { throwAndUnwindWorkLoop, workLoopSync } from "@zenflux/react-reconciler/src/react-fiber-work-on-root-loop";
import { SuspendedReason } from "@zenflux/react-reconciler/src/react-suspended-reason";
import { RootExitStatus } from "@zenflux/react-reconciler/src/root-exit-status";

import type { FiberRoot, Lanes } from "@zenflux/react-shared/src/react-internal-types";

// TODO: Over time, this function and renderRootConcurrent have become more
// and more similar. Not sure it makes sense to maintain forked paths. Consider
// unifying them again.
export function renderRootSync( root: FiberRoot, lanes: Lanes ) {
    const prevExecutionContext = getExecutionContext();
    activateRenderExecutionContext();
    const prevDispatcher = pushDispatcher( root.containerInfo );
    const prevCacheDispatcher = pushCacheDispatcher();

    // If the root or lanes have changed, throw out the existing stack
    // and prepare a fresh one. Otherwise we'll continue where we left off.
    if ( getWorkInProgressRoot() !== root || getWorkInProgressRootRenderLanes() !== lanes ) {
        if ( enableUpdaterTracking ) {
            if ( isDevToolsPresent ) {
                const memoizedUpdaters = root.memoizedUpdaters;

                if ( memoizedUpdaters.size > 0 ) {
                    restorePendingUpdaters( root, getWorkInProgressRootRenderLanes() );
                    memoizedUpdaters.clear();
                }

                // At this point, move Fibers that scheduled the upcoming work from the Map to the Set.
                // If we bailout on this work, we'll move them back (like above).
                // It's important to move them now in case the work spawns more work at the same priority with different updaters.
                // That way we can keep the current update and future updates separate.
                movePendingFibersToMemoized( root, lanes );
            }
        }

        setWorkInProgressTransitions( getTransitionsForLanes( root, lanes ) );
        prepareWorkInProgressFreshStack( root, lanes );
    }

    if ( __DEV__ ) {
        if ( enableDebugTracing ) {
            logRenderStarted( lanes );
        }
    }

    if ( enableSchedulingProfiler ) {
        markRenderStarted( lanes );
    }

    let didSuspendInShell = false;

    outer: do {
        try {
            if ( getWorkInProgressSuspendedReason() !== SuspendedReason.NotSuspended && getWorkInProgress() !== null ) {
                // The work loop is suspended. During a synchronous render, we don't
                // yield to the main thread. Immediately unwind the stack. This will
                // trigger either a fallback or an error boundary.
                // TODO: For discrete and "default" updates (anything that's not
                // flushSync), we want to wait for the microtasks the flush before
                // unwinding. Will probably implement this using renderRootConcurrent,
                // or merge renderRootSync and renderRootConcurrent into the same
                // function and fork the behavior some other way.
                const unitOfWork = getWorkInProgressSafe();
                const thrownValue = getWorkInProgressThrownValue();

                switch ( getWorkInProgressSuspendedReason() ) {
                    case SuspendedReason.SuspendedOnHydration: {
                        // Selective hydration. An update flowed into a dehydrated tree.
                        // Interrupt the current render so the work loop can switch to the
                        // hydration lane.
                        resetWorkInProgressStack();
                        setWorkInProgressRootExitStatus( RootExitStatus.RootDidNotComplete );
                        break outer;
                    }

                    case SuspendedReason.SuspendedOnImmediate:
                    case SuspendedReason.SuspendedOnData: {
                        if ( ! didSuspendInShell && getSuspenseHandler() === null ) {
                            didSuspendInShell = true;
                        } // Intentional fallthrough

                    }

                    default: {
                        // Unwind then continue with the normal work loop.
                        setWorkInProgressSuspendedReason( SuspendedReason.NotSuspended );
                        setWorkInProgressThrownValue( null );
                        throwAndUnwindWorkLoop( unitOfWork, thrownValue );
                        break;
                    }
                }
            }

            workLoopSync();
            break;
        } catch ( thrownValue ) {
            handleThrow( root, thrownValue );
        }
    } while ( true );

    // Check if something suspended in the shell. We use this to detect an
    // infinite ping loop caused by an uncached promise.
    //
    // Only increment this counter once per synchronous render attempt across the
    // whole tree. Even if there are many sibling components that suspend, this
    // counter only gets incremented once.
    if ( didSuspendInShell ) {
        root.shellSuspendCounter++;
    }

    resetContextDependencies();
    setExecutionContext( prevExecutionContext );

    popDispatcher( prevDispatcher );
    popCacheDispatcher( prevCacheDispatcher );

    if ( getWorkInProgress() !== null ) {
        // This is a sync render, so we should have finished the whole tree.
        throw new Error( "Cannot commit an incomplete root. This error is likely caused by a " + "bug in React. Please file an issue." );
    }

    if ( __DEV__ ) {
        if ( enableDebugTracing ) {
            logRenderStopped();
        }
    }

    if ( enableSchedulingProfiler ) {
        markRenderStopped();
    }

    // Set this to null to indicate there's no in-progress render.
    setWorkInProgressRoot( null );
    setWorkInProgressRootRenderLanes( NoLanes );
    // It's safe to process the queue now that the render phase is complete.
    finishQueueingConcurrentUpdates();
    return getWorkInProgressRootExitStatus();
}
