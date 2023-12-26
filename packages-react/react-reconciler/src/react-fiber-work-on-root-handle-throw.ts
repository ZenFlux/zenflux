import { enableProfilerTimer, enableSchedulingProfiler } from "@zenflux/react-shared/src/react-feature-flags";

import ReactSharedInternals from "@zenflux/react-shared/src/react-shared-internals";

import { TypeOfMode } from "@zenflux/react-shared/src/react-internal-constants/type-of-mode";

import { includesNonIdleWork } from "@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants";

import { resetCurrentFiber as resetCurrentDebugFiberInDEV } from "@zenflux/react-reconciler/src/react-current-fiber";
import { markComponentErrored, markComponentRenderStopped, markComponentSuspended } from "@zenflux/react-reconciler/src/react-fiber-dev-tools-hook";
import { resetHooksAfterThrow } from "@zenflux/react-reconciler/src/react-fiber-hooks";
import { getSuspendedThenable, SuspenseException, SuspenseyCommitException } from "@zenflux/react-reconciler/src/react-fiber-thenable";
import {
    getWorkInProgress,
    getWorkInProgressRootInterleavedUpdatedLanes, getWorkInProgressRootRenderLanes,
    getWorkInProgressRootSkippedLanes,
    getWorkInProgressSuspendedReason,
    setWorkInProgressRootExitStatus,
    setWorkInProgressRootFatalError,
    setWorkInProgressSuspendedReason,
    setWorkInProgressThrownValue
} from "@zenflux/react-reconciler/src/react-fiber-work-in-progress";
import { shouldRemainOnPreviousScreen } from "@zenflux/react-reconciler/src/react-fiber-work-loop-should-on-previous-screen";
import { SelectiveHydrationException } from "@zenflux/react-reconciler/src/react-fiber-work-selective-hydration-exception";
import { stopProfilerTimerIfRunningAndRecordDelta } from "@zenflux/react-reconciler/src/react-profile-timer";
import { SuspendedReason } from "@zenflux/react-reconciler/src/react-suspended-reason";
import { RootExitStatus } from "@zenflux/react-reconciler/src/root-exit-status";

import type { FiberRoot } from "@zenflux/react-shared/src/react-internal-types";
import type { Wakeable } from "@zenflux/react-shared/src/react-types";

const {
    ReactCurrentOwner,
} = ReactSharedInternals;

export function handleThrow( root: FiberRoot, thrownValue: any ): void {
    // A component threw an exception. Usually this is because it suspended, but
    // it also includes regular program errors.
    //
    // We're either going to unwind the stack to show a Suspense or error
    // boundary, or we're going to replay the component again. Like after a
    // promise resolves.
    //
    // Until we decide whether we're going to unwind or replay, we should preserve
    // the current state of the work loop without resetting anything.
    //
    // If we do decide to unwind the stack, module-level variables will be reset
    // in resetSuspendedWorkLoopOnUnwind.
    // These should be reset immediately because they're only supposed to be set
    // when React is executing user code.
    resetHooksAfterThrow();
    resetCurrentDebugFiberInDEV();
    ReactCurrentOwner.current = null;

    if ( thrownValue === SuspenseException ) {
        // This is a special type of exception used for Suspense. For historical
        // reasons, the rest of the Suspense implementation expects the thrown value
        // to be a thenable, because before `use` existed that was the (unstable)
        // API for suspending. This implementation detail can change later, once we
        // deprecate the old API in favor of `use`.
        thrownValue = getSuspendedThenable();

        setWorkInProgressSuspendedReason(
            shouldRemainOnPreviousScreen() && // Check if there are other pending updates that might possibly unblock this
            // component from suspending. This mirrors the check in
            // renderDidSuspendDelayIfPossible. We should attempt to unify them somehow.
            // TODO: Consider unwinding immediately, using the
            // SuspendedOnHydration mechanism.
            ! includesNonIdleWork( getWorkInProgressRootSkippedLanes() ) &&
            ! includesNonIdleWork( getWorkInProgressRootInterleavedUpdatedLanes() ) ? // Suspend work loop until data resolves
                SuspendedReason.SuspendedOnData : // Don't suspend work loop, except to check if the data has
                // immediately resolved (i.e. in a microtask). Otherwise, trigger the
                // nearest Suspense fallback.
                SuspendedReason.SuspendedOnImmediate
        );

    } else if ( thrownValue === SuspenseyCommitException ) {
        thrownValue = getSuspendedThenable();
        setWorkInProgressSuspendedReason( SuspendedReason.SuspendedOnInstance );
    } else if ( thrownValue === SelectiveHydrationException ) {
        // An update flowed into a dehydrated boundary. Before we can apply the
        // update, we need to finish hydrating. Interrupt the work-in-progress
        // render so we can restart at the hydration lane.
        //
        // The ideal implementation would be able to switch contexts without
        // unwinding the current stack.
        //
        // We could name this something more general but as of now it's the only
        // case where we think this should happen.
        setWorkInProgressSuspendedReason( SuspendedReason.SuspendedOnHydration );
    } else {
        // This is a regular error.
        const isWakeable = thrownValue !== null && typeof thrownValue === "object" && typeof thrownValue.then === "function";

        setWorkInProgressSuspendedReason(
            isWakeable ? // A wakeable object was thrown by a legacy Suspense implementation.
                // This has slightly different behavior than suspending with `use`.
                SuspendedReason.SuspendedOnDeprecatedThrowPromise : // This is a regular error. If something earlier in the component already
                // suspended, we must clear the thenable state to unblock the work loop.
                SuspendedReason.SuspendedOnError
        );
    }

    setWorkInProgressThrownValue( thrownValue );
    const erroredWork = getWorkInProgress();

    if ( erroredWork === null ) {
        // This is a fatal error
        setWorkInProgressRootExitStatus( RootExitStatus.RootFatalErrored );
        setWorkInProgressRootFatalError( thrownValue );
        return;
    }

    if ( enableProfilerTimer && erroredWork.mode & TypeOfMode.ProfileMode ) {
        // Record the time spent rendering before an error was thrown. This
        // avoids inaccurate Profiler durations in the case of a
        // suspended render.
        stopProfilerTimerIfRunningAndRecordDelta( erroredWork, true );
    }

    if ( enableSchedulingProfiler ) {
        markComponentRenderStopped();

        switch ( getWorkInProgressSuspendedReason() ) {
            case SuspendedReason.SuspendedOnError: {
                markComponentErrored( erroredWork, thrownValue, getWorkInProgressRootRenderLanes() )
                ;
                break;
            }

            case SuspendedReason.SuspendedOnData:
            case SuspendedReason.SuspendedOnImmediate:
            case SuspendedReason.SuspendedOnDeprecatedThrowPromise:
            case SuspendedReason.SuspendedAndReadyToContinue: {
                const wakeable: Wakeable = ( thrownValue as any );
                markComponentSuspended( erroredWork, wakeable, getWorkInProgressRootRenderLanes() )
                ;
                break;
            }

            case SuspendedReason.SuspendedOnInstance: {
                // This is conceptually like a suspend, but it's not associated with
                // a particular wakeable. It's associated with a host resource (e.g.
                // a CSS file or an image) that hasn't loaded yet. DevTools doesn't
                // handle this currently.
                break;
            }

            case SuspendedReason.SuspendedOnHydration: {
                // This is conceptually like a suspend, but it's not associated with
                // a particular wakeable. DevTools doesn't seem to care about this case,
                // currently. It's similar to if the component were interrupted, which
                // we don't mark with a special function.
                break;
            }
        }
    }
}
