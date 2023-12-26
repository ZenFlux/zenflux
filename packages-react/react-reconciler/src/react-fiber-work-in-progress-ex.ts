import { enableProfilerTimer } from "@zenflux/react-shared/src/react-feature-flags";

import { FiberFlags } from "@zenflux/react-shared/src/react-internal-constants/fiber-flags";

import { WorkTag } from "@zenflux/react-shared/src/react-internal-constants/work-tags";

import { createFiber } from "@zenflux/react-reconciler/src/react-fiber";

import {
    resolveClassForHotReloading,
    resolveForwardRefForHotReloading,
    resolveFunctionForHotReloading
} from "@zenflux/react-reconciler/src/react-fiber-hot-reloading-resvole";
import { SuspendedReason } from "@zenflux/react-reconciler/src/react-suspended-reason";
import {
    getWorkInProgress, getWorkInProgressRootRenderLanes, getWorkInProgressSafe,
    getWorkInProgressSuspendedReason,
    setWorkInProgress,
} from "@zenflux/react-reconciler/src/react-fiber-work-in-progress";
import { resetSuspendedWorkLoopOnUnwind } from "@zenflux/react-reconciler/src/react-fiber-work-unwind";
import { unwindInterruptedWork } from "@zenflux/react-reconciler/src/react-fiber-unwind-work";

import type { Fiber  } from "@zenflux/react-shared/src/react-internal-types";

export function resetWorkInProgressStack() {
    if ( getWorkInProgress() === null ) return;
    let interruptedWork;

    if ( getWorkInProgressSuspendedReason() === SuspendedReason.NotSuspended ) {
        // Normal case. Work-in-progress hasn't started yet. Unwind all
        // its parents.
        interruptedWork = getWorkInProgressSafe().return;
    } else {
        // Work-in-progress is in suspended state. Reset the work loop and unwind
        // both the suspended fiber and all its parents.
        resetSuspendedWorkLoopOnUnwind( getWorkInProgressSafe() );
        interruptedWork = getWorkInProgressSafe();
    }

    while ( interruptedWork !== null ) {
        const current = interruptedWork.alternate;
        unwindInterruptedWork( current, interruptedWork, getWorkInProgressRootRenderLanes() );
        interruptedWork = interruptedWork.return;
    }

    setWorkInProgress( null );
}

// This is used to create an alternate fiber to do work on.
export function createWorkInProgress( current: Fiber, pendingProps: any ): Fiber {
    let workInProgress = current.alternate;

    if ( workInProgress === null ) {
        // We use a double buffering pooling technique because we know that we'll
        // only ever need at most two versions of a tree. We pool the "other" unused
        // node that we're free to reuse. This is lazily created to avoid allocating
        // extra objects for things that are never updated. It also allow us to
        // reclaim the extra memory if needed.
        workInProgress = createFiber( current.tag, pendingProps, current.key, current.mode );
        workInProgress.elementType = current.elementType;
        workInProgress.type = current.type;
        workInProgress.stateNode = current.stateNode;

        if ( __DEV__ ) {
            // DEV-only fields
            workInProgress._debugSource = current._debugSource;
            workInProgress._debugOwner = current._debugOwner;
            workInProgress._debugHookTypes = current._debugHookTypes;
        }

        workInProgress.alternate = current;
        current.alternate = workInProgress;
    } else {
        workInProgress.pendingProps = pendingProps;
        // Needed because Blocks store data on type.
        workInProgress.type = current.type;
        // We already have an alternate.
        // Reset the effect tag.
        workInProgress.flags = FiberFlags.NoFlags;
        // The effects are no longer valid.
        workInProgress.subtreeFlags = FiberFlags.NoFlags;
        workInProgress.deletions = null;

        if ( enableProfilerTimer ) {
            // We intentionally reset, rather than copy, actualDuration & actualStartTime.
            // This prevents time from endlessly accumulating in new commits.
            // This has the downside of resetting values for different priority renders,
            // But works for yielding (the common case) and should support resuming.
            workInProgress.actualDuration = 0;
            workInProgress.actualStartTime = -1;
        }
    }

    // Reset all effects except static ones.
    // Static effects are not specific to a render.
    workInProgress.flags = current.flags & FiberFlags.StaticMask;
    workInProgress.childLanes = current.childLanes;
    workInProgress.lanes = current.lanes;
    workInProgress.child = current.child;
    workInProgress.memoizedProps = current.memoizedProps;
    workInProgress.memoizedState = current.memoizedState;
    workInProgress.updateQueue = current.updateQueue;
    // Clone the dependencies object. This is mutated during the render phase, so
    // it cannot be shared with the current fiber.
    const currentDependencies = current.dependencies;
    workInProgress.dependencies = currentDependencies === null ? null : {
        lanes: currentDependencies.lanes,
        firstContext: currentDependencies.firstContext
    };
    // These will be overridden during the parent's reconciliation
    workInProgress.sibling = current.sibling;
    workInProgress.index = current.index;
    workInProgress.ref = current.ref;
    workInProgress.refCleanup = current.refCleanup;

    if ( enableProfilerTimer ) {
        workInProgress.selfBaseDuration = current.selfBaseDuration;
        workInProgress.treeBaseDuration = current.treeBaseDuration;
    }

    if ( __DEV__ ) {
        workInProgress._debugNeedsRemount = current._debugNeedsRemount;

        switch ( workInProgress.tag ) {
            case WorkTag.IndeterminateComponent:
            case WorkTag.FunctionComponent:
            case WorkTag.SimpleMemoComponent:
                workInProgress.type = resolveFunctionForHotReloading( current.type );
                break;

            case WorkTag.ClassComponent:
                workInProgress.type = resolveClassForHotReloading( current.type );
                break;

            case WorkTag.ForwardRef:
                workInProgress.type = resolveForwardRefForHotReloading( current.type );
                break;

            default:
                break;
        }
    }

    return workInProgress;
}

