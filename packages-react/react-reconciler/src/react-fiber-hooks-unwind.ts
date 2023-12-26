import { NoLanes } from "@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants";

import { ReactFiberHooksCurrent, ReactFiberHooksFlags } from "@zenflux/react-reconciler/src/react-fiber-hooks-shared";

import type { Hook } from "@zenflux/react-reconciler/src/react-fiber-hooks-types";
import type { Fiber } from "@zenflux/react-shared/src/react-internal-types";

export function resetHooksOnUnwind( workInProgress: Fiber ): void {
    if ( ReactFiberHooksFlags.didScheduleRenderPhaseUpdate ) {
        // There were render phase updates. These are only valid for this render
        // phase, which we are now aborting. Remove the updates from the queues so
        // they do not persist to the next render. Do not remove updates from hooks
        // that weren't processed.
        //
        // Only reset the updates from the queue if it has a clone. If it does
        // not have a clone, that means it wasn't processed, and the updates were
        // scheduled before we entered the render phase.
        let hook: Hook | null = workInProgress.memoizedState;

        while ( hook !== null ) {
            const queue = hook.queue;

            if ( queue !== null ) {
                queue.pending = null;
            }

            hook = hook.next;
        }

        ReactFiberHooksFlags.didScheduleRenderPhaseUpdate = false;
    }

    ReactFiberHooksCurrent.renderLanes = NoLanes;
    ReactFiberHooksCurrent.renderingFiber = ( null as any );
    ReactFiberHooksCurrent.hook = null;
    ReactFiberHooksCurrent.workInProgressHook = null;

    if ( __DEV__ ) {
        ReactFiberHooksCurrent.hookTypesDev = null;
        ReactFiberHooksCurrent.hookTypesUpdateIndexDev = -1;
        ReactFiberHooksCurrent.hookNameInDev = null;
    }

    ReactFiberHooksFlags.didScheduleRenderPhaseUpdateDuringThisPass = false;

    ReactFiberHooksCurrent.localIdCounter = 0;
    ReactFiberHooksCurrent.thenableIndexCounter = 0;
    ReactFiberHooksCurrent.thenableState = null;
}
