
import { TypeOfMode } from "@zenflux/react-shared/src/react-internal-constants/type-of-mode";

import { FiberFlags } from "@zenflux/react-shared/src/react-internal-constants/fiber-flags";

import { noopSuspenseyCommitThenable } from "@zenflux/react-reconciler/src/react-fiber-thenable";

import { attachPingListener } from "@zenflux/react-reconciler/src/react-fiber-work-in-progress-ping";

import type { Wakeable } from "@zenflux/react-shared/src/react-types";
import type { Fiber, FiberRoot, Lanes } from "@zenflux/react-shared/src/react-internal-types";
import type { OffscreenQueue } from "@zenflux/react-shared/src/react-internal-types/offscreen";

export function handleOffscreenComponent(
    sourceFiber: Fiber,
    returnFiber: Fiber,
    suspenseBoundary: any,
    root: FiberRoot,
    rootRenderLanes: Lanes,
    wakeable: Wakeable,
) {
    let halt = suspenseBoundary.mode & TypeOfMode.ConcurrentMode;

    if ( halt ) {
        suspenseBoundary.flags |= FiberFlags.ShouldCapture;
        const isSuspenseyResource = wakeable === noopSuspenseyCommitThenable;

        if ( isSuspenseyResource ) {
            suspenseBoundary.flags |= FiberFlags.ScheduleRetry;
        } else {
            const offscreenQueue: OffscreenQueue | null = ( suspenseBoundary.updateQueue as any );

            if ( offscreenQueue === null ) {
                suspenseBoundary.updateQueue = {
                    transitions: null,
                    markerInstances: null,
                    retryQueue: new Set( [ wakeable ] )
                };
            } else {
                const retryQueue = offscreenQueue.retryQueue;

                if ( retryQueue === null ) {
                    offscreenQueue.retryQueue = new Set( [ wakeable ] );
                } else {
                    retryQueue.add( wakeable );
                }
            }

            attachPingListener( root, wakeable, rootRenderLanes );
        }
    }

    return halt;
}
