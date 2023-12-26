import { TypeOfMode } from "@zenflux/react-shared/src/react-internal-constants/type-of-mode";
import { FiberFlags } from "@zenflux/react-shared/src/react-internal-constants/fiber-flags";

import { getShellBoundary } from "@zenflux/react-reconciler/src/react-fiber-suspense-context";
import { renderDidSuspend, renderDidSuspendDelayIfPossible } from "@zenflux/react-reconciler/src/react-fiber-work-in-progress-render-did";
import { noopSuspenseyCommitThenable } from "@zenflux/react-reconciler/src/react-fiber-thenable";

import { attachPingListener } from "@zenflux/react-reconciler/src/react-fiber-work-in-progress-ping";
import { markSuspenseBoundaryShouldCapture } from "@zenflux/react-reconciler/src/react-fiber-throw-suspense-boundary";

import type { Fiber, FiberRoot, Lanes } from "@zenflux/react-shared/src/react-internal-types";
import type { Wakeable } from "@zenflux/react-shared/src/react-types";
import type { RetryQueue } from "@zenflux/react-shared/src/react-internal-types/queue";

export function handleSuspenseComponent(
    sourceFiber: Fiber,
    returnFiber: Fiber,
    suspenseBoundary: any,
    root: FiberRoot,
    rootRenderLanes: Lanes,
    wakeable: Wakeable,
) {
    // If this suspense boundary is not already showing a fallback, mark
    // the in-progress render as suspended. We try to perform this logic
    // as soon as soon as possible during the render phase, so the work
    // loop can know things like whether it's OK to switch to other tasks,
    // or whether it can wait for data to resolve before continuing.
    // TODO: Most of these checks are already performed when entering a
    // Suspense boundary. We should track the information on the stack so
    // we don't have to recompute it on demand. This would also allow us
    // to unify with `use` which needs to perform this logic even sooner,
    // before `throwException` is called.
    if ( sourceFiber.mode & TypeOfMode.ConcurrentMode ) {
        if ( getShellBoundary() === null ) {
            // Suspended in the "shell" of the app. This is an undesirable
            // loading state. We should avoid committing this tree.
            renderDidSuspendDelayIfPossible();
        } else {
            // If we suspended deeper than the shell, we don't need to delay
            // the commmit. However, we still call renderDidSuspend if this is
            // a new boundary, to tell the work loop that a new fallback has
            // appeared during this render.
            // TODO: Theoretically we should be able to delete this branch.
            // It's currently used for two things: 1) to throttle the
            // appearance of successive loading states, and 2) in
            // SuspenseList, to determine whether the children include any
            // pending fallbacks. For 1, we should apply throttling to all
            // retries, not just ones that render an additional fallback. For
            // 2, we should check subtreeFlags instead. Then we can delete
            // this branch.
            const current = suspenseBoundary.alternate;

            if ( current === null ) {
                renderDidSuspend();
            }
        }
    }

    suspenseBoundary.flags &= ~FiberFlags.ForceClientRender;
    markSuspenseBoundaryShouldCapture( suspenseBoundary, returnFiber, sourceFiber, root, rootRenderLanes );
    // Retry listener
    //
    // If the fallback does commit, we need to attach a different type of
    // listener. This one schedules an update on the Suspense boundary to
    // turn the fallback state off.
    //
    // Stash the wakeable on the boundary fiber so we can access it in the
    // commit phase.
    //
    // When the wakeable resolves, we'll attempt to render the boundary
    // again ("retry").
    // Check if this is a Suspensey resource. We do not attach retry
    // listeners to these, because we don't actually need them for
    // rendering. Only for committing. Instead, if a fallback commits
    // and the only thing that suspended was a Suspensey resource, we
    // retry immediately.
    // TODO: Refactor throwException so that we don't have to do this type
    // check. The caller already knows what the cause was.
    const isSuspenseyResource = wakeable === noopSuspenseyCommitThenable;

    if ( isSuspenseyResource ) {
        suspenseBoundary.flags |= FiberFlags.ScheduleRetry;
    } else {
        const retryQueue: RetryQueue | null = ( suspenseBoundary.updateQueue as any );

        if ( retryQueue === null ) {
            suspenseBoundary.updateQueue = new Set( [ wakeable ] );
        } else {
            retryQueue.add( wakeable );
        }

        // We only attach ping listeners in concurrent mode. Legacy
        // Suspense always commits fallbacks synchronously, so there are
        // no pings.
        if ( suspenseBoundary.mode & TypeOfMode.ConcurrentMode ) {
            attachPingListener( root, wakeable, rootRenderLanes );
        }
    }
}
