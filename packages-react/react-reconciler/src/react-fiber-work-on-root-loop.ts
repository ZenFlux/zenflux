import {
    disableLegacyContext,
    enableProfilerTimer,
    replayFailedUnitOfWorkWithInvokeGuardedCallback
} from "@zenflux/react-shared/src/react-feature-flags";

import { clearCaughtError, hasCaughtError, invokeGuardedCallback } from "@zenflux/react-shared/src/react-error-utils";

import ReactSharedInternals from "@zenflux/react-shared/src/react-shared-internals";

import { WorkTag } from "@zenflux/react-shared/src/react-internal-constants/work-tags";

import { TypeOfMode } from "@zenflux/react-shared/src/react-internal-constants/type-of-mode";

import { FiberFlags } from "@zenflux/react-shared/src/react-internal-constants/fiber-flags";

import { getEntangledRenderLanes } from "@zenflux/react-reconciler/src/react-entangled-lane";

import {
    getWorkInProgress,
    getWorkInProgressRoot,
    getWorkInProgressRootExitStatus,
    getWorkInProgressRootRenderLanes,
    getWorkInProgressSafe,
    resetWorkInProgress,
    setWorkInProgress,
    setWorkInProgressRootExitStatus,
    setWorkInProgressRootFatalError
} from "@zenflux/react-reconciler/src/react-fiber-work-in-progress";

import { resetSuspendedWorkLoopOnUnwind } from "@zenflux/react-reconciler/src/react-fiber-work-unwind";
import { RootExitStatus } from "@zenflux/react-reconciler/src/root-exit-status";
import { throwException } from "@zenflux/react-reconciler/src/react-fiber-throw";
import {
    resetCurrentFiber as resetCurrentDebugFiberInDEV,
    setCurrentFiber as setCurrentDebugFiberInDEV
} from "@zenflux/react-reconciler/src/react-current-fiber";
import { completeWork } from "@zenflux/react-reconciler/src/react-fiber-complete-work";
import {
    startProfilerTimer,
    stopProfilerTimerIfRunningAndRecordDelta
} from "@zenflux/react-reconciler/src/react-profile-timer";
import { unwindInterruptedWork, unwindWork } from "@zenflux/react-reconciler/src/react-fiber-unwind-work";

import { resolveDefaultProps } from "@zenflux/react-reconciler/src/react-fiber-lazy-component";
import { getMaskedContext, getUnmaskedContext } from "@zenflux/react-reconciler/src/react-fiber-context";
import {
    beginWork as originalBeginWork,
    replayFunctionComponent,
} from "@zenflux/react-reconciler/src/react-fiber-work-begin";
import { resetHooksOnUnwind } from "@zenflux/react-reconciler/src/react-fiber-hooks-unwind";

import { assignFiberPropertiesInDEV } from "@zenflux/react-reconciler/src/react-fiber";
import {
    didSuspendOrErrorWhileHydratingDEV
} from "@zenflux/react-reconciler/src/react-fiber-hydration-did-suspend-on-error";
import { SuspenseException } from "@zenflux/react-reconciler/src/react-fiber-thenable";

import { SelectiveHydrationException } from "@zenflux/react-reconciler/src/react-fiber-work-selective-hydration-exception";

import type { Fiber, FiberRoot, Lanes } from "@zenflux/react-shared/src/react-internal-types";

const {
    ReactCurrentOwner,
} = ReactSharedInternals;

let beginWork: any;

if ( __DEV__ && replayFailedUnitOfWorkWithInvokeGuardedCallback ) {
    const dummyFiber = null;

    beginWork = ( current: null | Fiber, unitOfWork: Fiber, lanes: Lanes ) => {
        // If a component throws an error, we replay it again in a synchronously
        // dispatched event, so that the debugger will treat it as an uncaught
        // error See ReactErrorUtils for more information.
        // Before entering the begin phase, copy the work-in-progress onto a dummy
        // fiber. If beginWork throws, we'll use this to reset the state.
        const originalWorkInProgressCopy = assignFiberPropertiesInDEV( dummyFiber, unitOfWork );

        try {
            return originalBeginWork( current, unitOfWork, lanes );
        } catch ( originalError: any ) {
            if (
                didSuspendOrErrorWhileHydratingDEV() ||
                originalError === SuspenseException ||
                originalError === SelectiveHydrationException ||
                (originalError !== null &&
                    typeof originalError === "object" &&
                    typeof originalError.then === "function")
            ) {                // Don't replay promises.
                // Don't replay errors if we are hydrating and have already suspended or handled an error
                throw originalError;
            }

            // Don't reset current debug fiber, since we're about to work on the
            // same fiber again.
            // Unwind the failed stack frame
            resetSuspendedWorkLoopOnUnwind( unitOfWork );
            unwindInterruptedWork( current, unitOfWork, getWorkInProgressRootRenderLanes() );
            // Restore the original properties of the fiber.
            assignFiberPropertiesInDEV( unitOfWork, originalWorkInProgressCopy );

            if ( enableProfilerTimer && unitOfWork.mode & TypeOfMode.ProfileMode ) {
                // Reset the profiler timer.
                startProfilerTimer( unitOfWork );
            }

            // Run beginWork again.
            invokeGuardedCallback( null, originalBeginWork, null, current, unitOfWork, lanes );

            if ( hasCaughtError() ) {
                const replayError = clearCaughtError();

                if ( typeof replayError === "object" && replayError !== null && replayError._suppressLogging && typeof originalError === "object" && originalError !== null && ! originalError._suppressLogging ) {
                    // If suppressed, let the flag carry over to the original error which is the one we'll rethrow.
                    originalError._suppressLogging = true;
                }
            }

            // We always throw the original error in case the second render pass is not idempotent.
            // This can happen if a memoized function or CommonJS module doesn't throw after first invocation.
            throw originalError;
        }
    };
} else {
    beginWork = originalBeginWork;
}

// The work loop is an extremely hot path. Tell Closure not to inline it.

/** @noinline */
export function workLoopSync() {
    // Perform work without checking if we need to yield between fiber.
    while ( getWorkInProgress() !== null ) {
        performUnitOfWork( getWorkInProgressSafe() );
    }
}

export function throwAndUnwindWorkLoop( unitOfWork: Fiber, thrownValue: unknown ) {
    // This is a fork of performUnitOfWork specifcally for unwinding a fiber
    // that threw an exception.
    //
    // Return to the normal work loop. This will unwind the stack, and potentially
    // result in showing a fallback.
    resetSuspendedWorkLoopOnUnwind( unitOfWork );
    const returnFiber = unitOfWork.return;

    if ( returnFiber === null || getWorkInProgressRoot() === null ) {
        // Expected to be working on a non-root fiber. This is a fatal error
        // because there's no ancestor that can handle it; the root is
        // supposed to capture all errors that weren't caught by an error
        // boundary.
        setWorkInProgressRootExitStatus( RootExitStatus.RootFatalErrored );
        setWorkInProgressRootFatalError( thrownValue );
        // Set `WorkInProgress` to null. This represents advancing to the next
        // sibling, or the parent if there are no siblings. But since the root
        // has no siblings nor a parent, we set it to null. Usually this is
        // handled by `completeUnitOfWork` or `unwindWork`, but since we're
        // intentionally not calling those, we need set it here.
        // TODO: Consider calling `unwindWork` to pop the contexts.
        setWorkInProgress( null );
        return;
    }

    try {
        // Find and mark the nearest Suspense or error boundary that can handle
        // this "exception".
        throwException( getWorkInProgressRoot() as NonNullable<FiberRoot>, returnFiber, unitOfWork, thrownValue, getWorkInProgressRootRenderLanes() );
    } catch ( error ) {
        // We had trouble processing the error. An example of this happening is
        // when accessing the `componentDidCatch` property of an error boundary
        // throws an error. A weird edge case. There's a regression test for this.
        // To prevent an infinite loop, bubble the error up to the next parent.
        setWorkInProgress( returnFiber );
        throw error;
    }

    if ( unitOfWork.flags & FiberFlags.Incomplete ) {
        // Unwind the stack until we reach the nearest boundary.
        unwindUnitOfWork( unitOfWork );
    } else {
        // Although the fiber suspended, we're intentionally going to commit it in
        // an inconsistent state. We can do this safely in cases where we know the
        // inconsistent tree will be hidden.
        //
        // This currently only applies to Legacy Suspense implementation, but we may
        // port a version of this to concurrent roots, too, when performing a
        // synchronous render. Because that will allow us to mutate the tree as we
        // go instead of buffering mutations until the end. Though it's unclear if
        // this particular path is how that would be implemented.
        completeUnitOfWork( unitOfWork );
    }
}

export function completeUnitOfWork( unitOfWork: Fiber ): void {
    // Attempt to complete the current unit of work, then move to the next
    // sibling. If there are no more siblings, return to the parent fiber.
    let completedWork: Fiber | null = unitOfWork;

    do {
        if ( __DEV__ ) {
            if ( ( completedWork.flags & FiberFlags.Incomplete ) !== FiberFlags.NoFlags ) {
                // NOTE: If we re-enable sibling prerendering in some cases, this branch
                // is where we would switch to the unwinding path.
                console.error( "Internal React error: Expected this fiber to be complete, but " + "it isn't. It should have been unwound. This is a bug in React." );
            }
        }

        // The current, flushed, state of this fiber is the alternate. Ideally
        // nothing should rely on this, but relying on it here means that we don't
        // need an additional field on the work in progress.
        const current = completedWork.alternate;
        const returnFiber: Fiber | null = completedWork.return;
        setCurrentDebugFiberInDEV( completedWork );
        let next;

        if ( ! enableProfilerTimer || ( completedWork.mode & TypeOfMode.ProfileMode ) === TypeOfMode.NoMode ) {
            next = completeWork( current, completedWork, getEntangledRenderLanes() );
        } else {
            startProfilerTimer( completedWork );
            next = completeWork( current, completedWork, getEntangledRenderLanes() );
            // Update render duration assuming we didn't error.
            stopProfilerTimerIfRunningAndRecordDelta( completedWork, false );
        }

        resetCurrentDebugFiberInDEV();

        if ( next !== null ) {
            // Completing this fiber spawned new work. Work on that next.
            setWorkInProgress( next );
            return;
        }

        const siblingFiber = completedWork.sibling;

        if ( siblingFiber !== null ) {
            // If there is more work to do in this returnFiber, do that next.
            setWorkInProgress( siblingFiber );
            return;
        }

        // Otherwise, return to the parent
        // $FlowFixMe[incompatible-type] we bail out when we get a null
        completedWork = returnFiber;
        // Update the next thing we're working on in case something throws.
        setWorkInProgress( completedWork );
    } while ( completedWork !== null );

    // We've reached the root.
    if ( getWorkInProgressRootExitStatus() === RootExitStatus.RootInProgress ) {
        setWorkInProgressRootExitStatus( RootExitStatus.RootCompleted );
    }
}

function unwindUnitOfWork( unitOfWork: Fiber ): void {
    let incompleteWork: Fiber | null = unitOfWork;

    do {
        // The current, flushed, state of this fiber is the alternate. Ideally
        // nothing should rely on this, but relying on it here means that we don't
        // need an additional field on the work in progress.
        const current = incompleteWork.alternate;
        // This fiber did not complete because something threw. Pop values off
        // the stack without entering the complete phase. If this is a boundary,
        // capture values if possible.
        const next = unwindWork( current, incompleteWork, getEntangledRenderLanes() );

        // Because this fiber did not complete, don't reset its lanes.
        if ( next !== null ) {
            // Found a boundary that can handle this exception. Re-renter the
            // begin phase. This branch will return us to the normal work loop.
            //
            // Since we're restarting, remove anything that is not a host effect
            // from the effect tag.
            next.flags &= FiberFlags.HostEffectMask;
            setWorkInProgress( next );
            return;
        }

        // Keep unwinding until we reach either a boundary or the root.
        if ( enableProfilerTimer && ( incompleteWork.mode & TypeOfMode.ProfileMode ) !== TypeOfMode.NoMode ) {
            // Record the render duration for the fiber that errored.
            stopProfilerTimerIfRunningAndRecordDelta( incompleteWork, false );
            // Include the time spent working on failed children before continuing.
            let actualDuration = incompleteWork.actualDuration;
            let child = incompleteWork.child;

            while ( child !== null ) {
                // $FlowFixMe[unsafe-addition] addition with possible null/undefined value
                // @ts-ignore
                actualDuration += child.actualDuration;
                child = child.sibling;
            }

            incompleteWork.actualDuration = actualDuration;
        }

        // TODO: Once we stop prerendering siblings, instead of resetting the parent
        // of the node being unwound, we should be able to reset node itself as we
        // unwind the stack. Saves an additional null check.
        const returnFiber: Fiber | null = incompleteWork.return;

        if ( returnFiber !== null ) {
            // Mark the parent fiber as incomplete and clear its subtree flags.
            // TODO: Once we stop prerendering siblings, we may be able to get rid of
            // the Incomplete flag because unwinding to the nearest boundary will
            // happen synchronously.
            returnFiber.flags |= FiberFlags.Incomplete;
            returnFiber.subtreeFlags = FiberFlags.NoFlags;
            returnFiber.deletions = null;
        }

        // NOTE: If we re-enable sibling prerendering in some cases, here we
        // would switch to the normal completion path: check if a sibling
        // exists, and if so, begin work on it.
        // Otherwise, return to the parent
        // $FlowFixMe[incompatible-type] we bail out when we get a null
        incompleteWork = returnFiber;
        // Update the next thing we're working on in case something throws.
        setWorkInProgress( incompleteWork );
    } while ( incompleteWork !== null );

    // We've unwound all the way to the root.
    setWorkInProgressRootExitStatus( RootExitStatus.RootDidNotComplete );
    setWorkInProgress( null );
}

export function performUnitOfWork( unitOfWork: Fiber ): void {
    // The current, flushed, state of this fiber is the alternate. Ideally
    // nothing should rely on this, but relying on it here means that we don't
    // need an additional field on the work in progress.
    const current = unitOfWork.alternate;
    setCurrentDebugFiberInDEV( unitOfWork );
    let next;

    if ( enableProfilerTimer && ( unitOfWork.mode & TypeOfMode.ProfileMode ) !== TypeOfMode.NoMode ) {
        startProfilerTimer( unitOfWork );
        next = beginWork( current, unitOfWork, getEntangledRenderLanes() );
        stopProfilerTimerIfRunningAndRecordDelta( unitOfWork, true );
    } else {
        next = beginWork( current, unitOfWork, getEntangledRenderLanes() );
    }

    resetCurrentDebugFiberInDEV();
    unitOfWork.memoizedProps = unitOfWork.pendingProps;

    if ( next === null ) {
        // If this doesn't spawn new work, complete the current work.
        completeUnitOfWork( unitOfWork );
    } else {
        setWorkInProgress( next );
    }

    ReactCurrentOwner.current = null;
}

export function replaySuspendedUnitOfWork( unitOfWork: Fiber ): void {
    // This is a fork of performUnitOfWork specifcally for replaying a fiber that
    // just suspended.
    //
    const current = unitOfWork.alternate;
    setCurrentDebugFiberInDEV( unitOfWork );
    let next;
    setCurrentDebugFiberInDEV( unitOfWork );
    const isProfilingMode = enableProfilerTimer && ( unitOfWork.mode & TypeOfMode.ProfileMode ) !== TypeOfMode.NoMode;

    if ( isProfilingMode ) {
        startProfilerTimer( unitOfWork );
    }

    switch ( unitOfWork.tag ) {
        case WorkTag.IndeterminateComponent: {
            // Because it suspended with `use`, we can assume it's a
            // function component.
            unitOfWork.tag = WorkTag.FunctionComponent; // Fallthrough to the next branch.
        }

        case WorkTag.SimpleMemoComponent:
        case WorkTag.FunctionComponent: {
            // Resolve `defaultProps`. This logic is copied from `beginWork`.
            // TODO: Consider moving this switch statement into that module. Also,
            // could maybe use this as an opportunity to say `use` doesn't work with
            // `defaultProps` :)
            const Component = unitOfWork.type;
            const unresolvedProps = unitOfWork.pendingProps;
            const resolvedProps = unitOfWork.elementType === Component ? unresolvedProps : resolveDefaultProps( Component, unresolvedProps );
            let context: any;

            if ( ! disableLegacyContext ) {
                const unmaskedContext = getUnmaskedContext( unitOfWork, Component, true );
                context = getMaskedContext( unitOfWork, unmaskedContext );
            }

            next = replayFunctionComponent( current, unitOfWork, resolvedProps, Component, context, getWorkInProgressRootRenderLanes() )
            ;
            break;
        }

        case WorkTag.ForwardRef: {
            // Resolve `defaultProps`. This logic is copied from `beginWork`.
            // TODO: Consider moving this switch statement into that module. Also,
            // could maybe use this as an opportunity to say `use` doesn't work with
            // `defaultProps` :)
            const Component = unitOfWork.type.render;
            const unresolvedProps = unitOfWork.pendingProps;
            const resolvedProps = unitOfWork.elementType === Component ? unresolvedProps : resolveDefaultProps( Component, unresolvedProps );
            next = replayFunctionComponent( current, unitOfWork, resolvedProps, Component, unitOfWork.ref, getWorkInProgressRootRenderLanes() );
            break;
        }

        case WorkTag.HostComponent: {
            // Some host components are stateful (that's how we implement form
            // actions) but we don't bother to reuse the memoized state because it's
            // not worth the extra code. The main reason to reuse the previous hooks
            // is to reuse uncached promises, but we happen to know that the only
            // promises that a host component might suspend on are definitely cached
            // because they are controlled by us. So don't bother.
            resetHooksOnUnwind( unitOfWork ); // Fallthrough to the next branch.
        }

        default: {
            // Other types besides function components are reset completely before
            // being replayed. Currently this only happens when a Usable type is
            // reconciled — the reconciler will suspend.
            //
            // We reset the fiber back to its original state; however, this isn't
            // a full "unwind" because we're going to reuse the promises that were
            // reconciled previously. So it's intentional that we don't call
            // resetSuspendedWorkLoopOnUnwind here.
            unwindInterruptedWork( current, unitOfWork, getWorkInProgressRootRenderLanes() );
            // Original:
            // unitOfWork = WorkInProgress = resetWorkInProgress( unitOfWork, getEntangledRenderLanes() );

            setWorkInProgress(
                resetWorkInProgress( getWorkInProgressSafe(), getEntangledRenderLanes() )
            );

            unitOfWork = getWorkInProgressSafe();

            next = beginWork( current, unitOfWork, getEntangledRenderLanes() );
            break;
        }
    }

    if ( isProfilingMode ) {
        stopProfilerTimerIfRunningAndRecordDelta( unitOfWork, true );
    }

    // The begin phase finished successfully without suspending. Return to the
    // normal work loop.
    resetCurrentDebugFiberInDEV();
    unitOfWork.memoizedProps = unitOfWork.pendingProps;

    if ( next === null ) {
        // If this doesn't spawn new work, complete the current work.
        completeUnitOfWork( unitOfWork );
    } else {
        setWorkInProgress( next );
    }

    ReactCurrentOwner.current = null;
}
