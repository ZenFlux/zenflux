import ReactSharedInternals from "@zenflux/react-shared/src/react-shared-internals";

import { NoLane, NoLanes, SyncLane } from "@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants";

import { peekEntangledActionLane } from "@zenflux/react-reconciler/src/react-fiber-async-action";
import { enqueueConcurrentHookUpdate } from "@zenflux/react-reconciler/src/react-fiber-concurrent-updates";

import {
    isRenderPhaseUpdate,
    markUpdateInDevTools,
    mountWorkInProgressHook,
    updateWorkInProgressHook
} from "@zenflux/react-reconciler/src/react-fiber-hooks-infra";

import { ReactFiberHooksCurrent } from "@zenflux/react-reconciler/src/react-fiber-hooks-shared";

import { updateReducerImpl } from "@zenflux/react-reconciler/src/react-fiber-hooks-use-reducer";
import { basicStateReducer } from "@zenflux/react-reconciler/src/react-fiber-hooks-use-state";

import { requestTransitionLane } from "@zenflux/react-reconciler/src/react-fiber-root-scheduler";
import { scheduleUpdateOnFiber } from "@zenflux/react-reconciler/src/react-fiber-work-schedule-update";

import type { HookUpdate } from "@zenflux/react-shared/src/react-internal-types/update";

import type { Hook } from "@zenflux/react-reconciler/src/react-fiber-hooks-types";
import type { Fiber, HookUpdateQueue } from "@zenflux/react-shared/src/react-internal-types";

const {
    ReactCurrentBatchConfig
} = ReactSharedInternals;

export function dispatchOptimisticSetState<S, A>( fiber: Fiber, throwIfDuringRender: boolean, queue: HookUpdateQueue<S, A>, action: A ): void {
    if ( __DEV__ ) {
        if ( ReactCurrentBatchConfig.transition === null ) {
            // An optimistic update occurred, but startTransition is not on the stack.
            // There are two likely scenarios.
            // One possibility is that the optimistic update is triggered by a regular
            // event handler (e.g. `onSubmit`) instead of an action. This is a mistake
            // and we will warn.
            // The other possibility is the optimistic update is inside an async
            // action, but after an `await`. In this case, we can make it "just work"
            // by associating the optimistic update with the pending async action.
            // Technically it's possible that the optimistic update is unrelated to
            // the pending action, but we don't have a way of knowing this for sure
            // because browsers currently do not provide a way to track async scope.
            // (The AsyncContext proposal, if it lands, will solve this in the
            // future.) However, this is no different than the problem of unrelated
            // transitions being grouped together — it's not wrong per se, but it's
            // not ideal.
            // Once AsyncContext starts landing in browsers, we will provide better
            // warnings in development for these cases.
            if ( peekEntangledActionLane() !== NoLane ) {// There is a pending async action. Don't warn.
            } else {
                // There's no pending async action. The most likely cause is that we're
                // inside a regular event handler (e.g. onSubmit) instead of an action.
                console.error( "An optimistic state update occurred outside a transition or " + "action. To fix, move the update to an action, or wrap " + "with startTransition." );
            }
        }
    }

    const update: HookUpdate<S, A> = {
        // An optimistic update commits synchronously.
        lane: SyncLane,
        // After committing, the optimistic update is "reverted" using the same
        // lane as the transition it's associated with.
        revertLane: requestTransitionLane(),
        action,
        hasEagerState: false,
        eagerState: null,
        next: ( null as any )
    };

    if ( isRenderPhaseUpdate( fiber ) ) {
        // When calling startTransition during render, this warns instead of
        // throwing because throwing would be a breaking change. setOptimisticState
        // is a new API so it's OK to throw.
        if ( throwIfDuringRender ) {
            throw new Error( "Cannot update optimistic state while rendering." );
        } else {
            // startTransition was called during render. We don't need to do anything
            // besides warn here because the render phase update would be overidden by
            // the second update, anyway. We can remove this branch and make it throw
            // in a future release.
            if ( __DEV__ ) {
                console.error( "Cannot call startTransition while rendering." );
            }
        }
    } else {
        const root = enqueueConcurrentHookUpdate( fiber, queue, update, SyncLane );

        if ( root !== null ) {
            // NOTE: The optimistic update implementation assumes that the transition
            // will never be attempted before the optimistic update. This currently
            // holds because the optimistic update is always synchronous. If we ever
            // change that, we'll need to account for this.
            scheduleUpdateOnFiber( root, fiber, SyncLane ); // Optimistic updates are always synchronous, so we don't need to call
            // entangleTransitionUpdate here.
        }
    }

    markUpdateInDevTools( fiber, SyncLane, action );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function mountOptimistic<S, A>( passthrough: S, reducer: ( ( arg0: S, arg1: A ) => S ) | null | undefined ): [ S, ( arg0: A ) => void ] {
    const hook = mountWorkInProgressHook();
    hook.memoizedState = hook.baseState = passthrough;
    const queue: HookUpdateQueue<S, A> = {
        pending: null,
        lanes: NoLanes,
        dispatch: null,
        // Optimistic state does not use the eager update optimization.
        lastRenderedReducer: null,
        lastRenderedState: null
    };
    hook.queue = queue;
    // This is different then the normal setState function.
    const dispatch: ( arg0: A ) => void = ( dispatchOptimisticSetState.bind( null, ReactFiberHooksCurrent.renderingFiber, true,
        // @ts-ignore
        queue
    ) as any );
    queue.dispatch = dispatch;
    return [ passthrough, dispatch ];
}

export function updateOptimistic<S, A>( passthrough: S, reducer: ( ( arg0: S, arg1: A ) => S ) | null | undefined ): [ S, ( arg0: A ) => void ] {
    const hook = updateWorkInProgressHook();
    return updateOptimisticImpl( hook, ( ( ReactFiberHooksCurrent.hook as any ) as Hook ), passthrough, reducer );
}

function updateOptimisticImpl<S, A>( hook: Hook, current: Hook | null, passthrough: S, reducer: ( ( arg0: S, arg1: A ) => S ) | null | undefined ): [ S, ( arg0: A ) => void ] {
    // Optimistic updates are always rebased on top of the latest value passed in
    // as an argument. It's called a passthrough because if there are no pending
    // updates, it will be returned as-is.
    //
    // Reset the base state to the passthrough. Future updates will be applied
    // on top of this.
    hook.baseState = passthrough;
    // If a reducer is not provided, default to the same one used by useState.
    const resolvedReducer: ( arg0: S, arg1: A ) => S = typeof reducer === "function" ? reducer : ( basicStateReducer as any );
    return updateReducerImpl( hook, ( ( ReactFiberHooksCurrent.hook as any ) as Hook ), resolvedReducer );
}

export function rerenderOptimistic<S, A>( passthrough: S, reducer: ( ( arg0: S, arg1: A ) => S ) | null | undefined ): [ S, ( arg0: A ) => void ] {
    // Unlike useState, useOptimistic doesn't support render phase updates.
    // Also unlike useState, we need to replay all pending updates again in case
    // the passthrough value changed.
    //
    // So instead of a forked re-render implementation that knows how to handle
    // render phase udpates, we can use the same implementation as during a
    // regular mount or update.
    const hook = updateWorkInProgressHook();

    if ( ReactFiberHooksCurrent.hook !== null ) {
        // This is an update. Process the update queue.
        return updateOptimisticImpl( hook, ( ( ReactFiberHooksCurrent.hook as any ) as Hook ), passthrough, reducer );
    }

    // This is a mount. No updates to process.
    // Reset the base state to the passthrough. Future updates will be applied
    // on top of this.
    hook.baseState = passthrough;
    const dispatch = hook.queue.dispatch;
    return [ passthrough, dispatch ];
}
