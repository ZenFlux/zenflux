import is from "@zenflux/react-shared/src/object-is";
import { enableAsyncActions } from "@zenflux/react-shared/src/react-feature-flags";

import {
    NoLane,
    NoLanes,
    OffscreenLane
} from "@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants";

import { entangleTransitionUpdate } from "@zenflux/react-reconciler/src/react-entangled-transaction";
import { enqueueConcurrentHookUpdate } from "@zenflux/react-reconciler/src/react-fiber-concurrent-updates";
import {
    enqueueRenderPhaseUpdate,
    isRenderPhaseUpdate,
    markUpdateInDevTools,
    mountWorkInProgressHook,
    updateWorkInProgressHook
} from "@zenflux/react-reconciler/src/react-fiber-hooks-infra";
import { ReactFiberHooksCurrent, ReactFiberHooksInfra } from "@zenflux/react-reconciler/src/react-fiber-hooks-shared";
import { isSubsetOfLanes, mergeLanes, removeLanes } from "@zenflux/react-reconciler/src/react-fiber-lane";
import {
    getWorkInProgressRootRenderLanes,
    markSkippedUpdateLanes
} from "@zenflux/react-reconciler/src/react-fiber-work-in-progress";

import { markWorkInProgressReceivedUpdate } from "@zenflux/react-reconciler/src/react-fiber-work-in-progress-receive-update";

import { requestUpdateLane } from "@zenflux/react-reconciler/src/react-fiber-work-in-progress-request-lane";
import { scheduleUpdateOnFiber } from "@zenflux/react-reconciler/src/react-fiber-work-schedule-update";

import type { Fiber, HookUpdateQueue } from "@zenflux/react-shared/src/react-internal-types";

import type {
    Dispatch,
    DispatchWithoutAction,
    Hook,
    Reducer,
    ReducerAction,
    ReducerState,
    ReducerStateWithoutAction,
    ReducerWithoutAction
} from "@zenflux/react-reconciler/src/react-fiber-hooks-types";
import type { HookUpdate } from "@zenflux/react-shared/src/react-internal-types/update";

function dispatchReducerAction<S, A>( fiber: Fiber, queue: HookUpdateQueue<S, A>, action: A ): void {
    if ( __DEV__ ) {
        if ( typeof arguments[ 3 ] === "function" ) {
            console.error( "State updates from the useState() and useReducer() Hooks don't support the " + "second callback argument. To execute a side effect after " + "rendering, declare it in the component body with useEffect()." );
        }
    }

    const lane = requestUpdateLane( fiber );
    const update: HookUpdate<S, A> = {
        lane,
        revertLane: NoLane,
        action,
        hasEagerState: false,
        eagerState: null,
        next: ( null as any )
    };

    if ( isRenderPhaseUpdate( fiber ) ) {
        enqueueRenderPhaseUpdate( queue, update );
    } else {
        const root = enqueueConcurrentHookUpdate( fiber, queue, update, lane );

        if ( root !== null ) {
            scheduleUpdateOnFiber( root, fiber, lane );
            entangleTransitionUpdate( root, queue, lane );
        }
    }

    markUpdateInDevTools( fiber, lane, action );
}

export function rerenderReducer<R extends ReducerWithoutAction<any>, I>( reducer: R, initializerArg: I, initializer: ( arg: I ) => ReducerStateWithoutAction<R>, ): [ ReducerStateWithoutAction<R>, DispatchWithoutAction ];
export function rerenderReducer<R extends ReducerWithoutAction<any>>( reducer: R, initializerArg: ReducerStateWithoutAction<R>, initializer?: undefined ): [ ReducerStateWithoutAction<R>, DispatchWithoutAction ];
export function rerenderReducer<R extends Reducer<any, any>, I>( reducer: R, initializerArg: I & ReducerState<R>, initializer: ( arg: I & ReducerState<R> ) => ReducerState<R> ): [ ReducerState<R>, Dispatch<ReducerAction<R>> ];
export function rerenderReducer<R extends Reducer<any, any>, I>( reducer: R, initializerArg: I, initializer: ( arg: I ) => ReducerState<R>, ): [ ReducerState<R>, Dispatch<ReducerAction<R>> ];
export function rerenderReducer<R extends Reducer<any, any>>( reducer: R, initialState: ReducerState<R>, initializer?: undefined, ): [ ReducerState<R>, Dispatch<ReducerAction<R>> ];
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function rerenderReducer<S, I, A>( reducer: ( arg0: S, arg1: A ) => S, initialArg: I, init?: ( arg0: I ) => S ): [ S, Dispatch<A> ] {
    const hook = updateWorkInProgressHook();
    const queue = hook.queue;

    if ( queue === null ) {
        throw new Error( "Should have a queue. This is likely a bug in React. Please file an issue." );
    }

    queue.lastRenderedReducer = reducer;
    // This is a re-render. Apply the new render phase updates to the previous
    // work-in-progress hook.
    const dispatch: Dispatch<A> = ( queue.dispatch as any );
    const lastRenderPhaseUpdate = queue.pending;
    let newState = hook.memoizedState;

    if ( lastRenderPhaseUpdate !== null ) {
        // The queue doesn't persist past this render pass.
        queue.pending = null;
        const firstRenderPhaseUpdate = lastRenderPhaseUpdate.next;
        let update = firstRenderPhaseUpdate;

        do {
            // Process this render phase update. We don't have to check the
            // priority because it will always be the same as the current
            // render's.
            const action = update.action;
            newState = reducer( newState, action );
            update = update.next;
        } while ( update !== firstRenderPhaseUpdate );

        // Mark that the fiber performed work, but only if the new state is
        // different from the current state.
        if ( ! is( newState, hook.memoizedState ) ) {
            markWorkInProgressReceivedUpdate();
        }

        hook.memoizedState = newState;

        // Don't persist the state accumulated from the render phase updates to
        // the base state unless the queue is empty.
        // TODO: Not sure if this is the desired semantics, but it's what we
        // do for gDSFP. I can't remember why.
        if ( hook.baseQueue === null ) {
            hook.baseState = newState;
        }

        queue.lastRenderedState = newState;
    }

    return [ newState, dispatch ];
}

export function mountReducer<R extends ReducerWithoutAction<any>, I>( reducer: R, initializerArg: I, initializer: ( arg: I ) => ReducerStateWithoutAction<R>, ): [ ReducerStateWithoutAction<R>, DispatchWithoutAction ];
export function mountReducer<R extends ReducerWithoutAction<any>>( reducer: R, initializerArg: ReducerStateWithoutAction<R>, initializer?: undefined ): [ ReducerStateWithoutAction<R>, DispatchWithoutAction ];
export function mountReducer<R extends Reducer<any, any>, I>( reducer: R, initializerArg: I & ReducerState<R>, initializer: ( arg: I & ReducerState<R> ) => ReducerState<R> ): [ ReducerState<R>, Dispatch<ReducerAction<R>> ];
export function mountReducer<R extends Reducer<any, any>, I>( reducer: R, initializerArg: I, initializer: ( arg: I ) => ReducerState<R>, ): [ ReducerState<R>, Dispatch<ReducerAction<R>> ];
export function mountReducer<R extends Reducer<any, any>>( reducer: R, initialState: ReducerState<R>, initializer?: undefined, ): [ ReducerState<R>, Dispatch<ReducerAction<R>> ];
export function mountReducer<S, I, A>( reducer: ( arg0: S, arg1: A ) => S, initialArg: I, init?: ( arg0: I ) => S ): [ S, Dispatch<A> ] {
    const hook = mountWorkInProgressHook();
    let initialState;

    if ( init !== undefined ) {
        initialState = init( initialArg );
    } else {
        initialState = ( ( initialArg as any ) as S );
    }

    hook.memoizedState = hook.baseState = initialState;
    const queue: HookUpdateQueue<S, A> = {
        pending: null,
        lanes: NoLanes,
        dispatch: null,
        lastRenderedReducer: reducer,
        lastRenderedState: ( initialState as any )
    };
    hook.queue = queue;
    const dispatch: Dispatch<A> = queue.dispatch = ( dispatchReducerAction.bind( null, ReactFiberHooksCurrent.renderingFiber,
        // @ts-ignore
        queue
    ) as any );
    return [ hook.memoizedState, dispatch ];
}

export function updateReducer<R extends ReducerWithoutAction<any>, I>( reducer: R, initializerArg: I, initializer: ( arg: I ) => ReducerStateWithoutAction<R>, ): [ ReducerStateWithoutAction<R>, DispatchWithoutAction ];
export function updateReducer<R extends ReducerWithoutAction<any>>( reducer: R, initializerArg: ReducerStateWithoutAction<R>, initializer?: undefined ): [ ReducerStateWithoutAction<R>, DispatchWithoutAction ];
export function updateReducer<R extends Reducer<any, any>, I>( reducer: R, initializerArg: I & ReducerState<R>, initializer: ( arg: I & ReducerState<R> ) => ReducerState<R> ): [ ReducerState<R>, Dispatch<ReducerAction<R>> ];
export function updateReducer<R extends Reducer<any, any>, I>( reducer: R, initializerArg: I, initializer: ( arg: I ) => ReducerState<R>, ): [ ReducerState<R>, Dispatch<ReducerAction<R>> ];
export function updateReducer<R extends Reducer<any, any>>( reducer: R, initialState: ReducerState<R>, initializer?: undefined, ): [ ReducerState<R>, Dispatch<ReducerAction<R>> ];
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function updateReducer<S, I, A>( reducer: ( arg0: S, arg1: A ) => S, initialArg: I, init?: ( arg0: I ) => S ): [ S, Dispatch<A> ] {
    const hook = updateWorkInProgressHook();
    return updateReducerImpl( hook, ( ( ReactFiberHooksCurrent.hook as any ) as Hook ), reducer );
}

export function updateReducerImpl<S, A>( hook: Hook, current: Hook, reducer: ( arg0: S, arg1: A ) => S ): [ S, Dispatch<A> ] {
    const queue = hook.queue;

    if ( queue === null ) {
        throw new Error( "Should have a queue. This is likely a bug in React. Please file an issue." );
    }

    queue.lastRenderedReducer = reducer;
    // The last rebase update that is NOT part of the base state.
    let baseQueue = hook.baseQueue;
    // The last pending update that hasn't been processed yet.
    const pendingQueue = queue.pending;

    if ( pendingQueue !== null ) {
        // We have new updates that haven't been processed yet.
        // We'll add them to the base queue.
        if ( baseQueue !== null ) {
            // Merge the pending queue and the base queue.
            const baseFirst = baseQueue.next;
            baseQueue.next = pendingQueue.next;
            pendingQueue.next = baseFirst;
        }

        if ( __DEV__ ) {
            if ( current.baseQueue !== baseQueue ) {
                // Internal invariant that should never happen, but feasibly could in
                // the future if we implement resuming, or some form of that.
                console.error( "Internal error: Expected work-in-progress queue to be a clone. " + "This is a bug in React." );
            }
        }

        current.baseQueue = baseQueue = pendingQueue;
        queue.pending = null;
    }

    if ( baseQueue !== null ) {
        // We have a queue to process.
        const first = baseQueue.next;
        let newState = hook.baseState;
        let newBaseState = null;
        let newBaseQueueFirst: HookUpdate<S, A> | null = null;
        let newBaseQueueLast: HookUpdate<S, A> | null = null;
        let update = first;

        do {
            // An extra OffscreenLane bit is added to updates that were made to
            // a hidden tree, so that we can distinguish them from updates that were
            // already there when the tree was hidden.
            const updateLane = removeLanes( update.lane, OffscreenLane );
            const isHiddenUpdate = updateLane !== update.lane;
            // Check if this update was made while the tree was hidden. If so, then
            // it's not a "base" update and we should disregard the extra base lanes
            // that were added to ReactFiberHooksCurrent.renderLanes when we entered the Offscreen tree.
            const shouldSkipUpdate = isHiddenUpdate ?
                ! isSubsetOfLanes( getWorkInProgressRootRenderLanes(), updateLane ) :
                ! isSubsetOfLanes( ReactFiberHooksCurrent.renderLanes, updateLane );

            if ( shouldSkipUpdate ) {
                // Priority is insufficient. Skip this update. If this is the first
                // skipped update, the previous update/state is the new base
                // update/state.
                const clone: HookUpdate<S, A> = {
                    lane: updateLane,
                    revertLane: update.revertLane,
                    action: update.action,
                    hasEagerState: update.hasEagerState,
                    eagerState: update.eagerState,
                    next: ( null as any )
                };

                if ( newBaseQueueLast === null ) {
                    newBaseQueueFirst = newBaseQueueLast = clone;
                    newBaseState = newState;
                } else {
                    // @ts-ignore
                    newBaseQueueLast = newBaseQueueLast.next = clone;
                }

                // Update the remaining priority in the queue.
                // TODO: Don't need to accumulate this. Instead, we can remove
                // ReactFiberHooksCurrent.renderLanes from the original lanes.
                ReactFiberHooksCurrent.renderingFiber.lanes = mergeLanes( ReactFiberHooksCurrent.renderingFiber.lanes, updateLane );
                markSkippedUpdateLanes( updateLane );
            } else {
                // This update does have sufficient priority.
                // Check if this is an optimistic update.
                const revertLane = update.revertLane;

                if ( ! enableAsyncActions || revertLane === NoLane ) {
                    // This is not an optimistic update, and we're going to apply it now.
                    // But, if there were earlier updates that were skipped, we need to
                    // leave this update in the queue so it can be rebased later.
                    if ( newBaseQueueLast !== null ) {
                        const clone: HookUpdate<S, A> = {
                            // This update is going to be committed so we never want uncommit
                            // it. Using NoLane works because 0 is a subset of all bitmasks, so
                            // this will never be skipped by the check above.
                            lane: NoLane,
                            revertLane: NoLane,
                            action: update.action,
                            hasEagerState: update.hasEagerState,
                            eagerState: update.eagerState,
                            next: ( null as any )
                        };
                        // @ts-ignore
                        newBaseQueueLast = newBaseQueueLast.next = clone;
                    }
                } else {
                    // This is an optimistic update. If the "revert" priority is
                    // sufficient, don't apply the update. Otherwise, apply the update,
                    // but leave it in the queue so it can be either reverted or
                    // rebased in a subsequent render.
                    if ( isSubsetOfLanes( ReactFiberHooksCurrent.renderLanes, revertLane ) ) {
                        // The transition that this optimistic update is associated with
                        // has finished. Pretend the update doesn't exist by skipping
                        // over it.
                        update = update.next;
                        continue;
                    } else {
                        const clone: HookUpdate<S, A> = {
                            // Once we commit an optimistic update, we shouldn't uncommit it
                            // until the transition it is associated with has finished
                            // (represented by revertLane). Using NoLane here works because 0
                            // is a subset of all bitmasks, so this will never be skipped by
                            // the check above.
                            lane: NoLane,
                            // Reuse the same revertLane so we know when the transition
                            // has finished.
                            revertLane: update.revertLane,
                            action: update.action,
                            hasEagerState: update.hasEagerState,
                            eagerState: update.eagerState,
                            next: ( null as any )
                        };

                        if ( newBaseQueueLast === null ) {
                            newBaseQueueFirst = newBaseQueueLast = clone;
                            newBaseState = newState;
                        } else {
                            // @ts-ignore
                            newBaseQueueLast = newBaseQueueLast.next = clone;
                        }

                        // Update the remaining priority in the queue.
                        // TODO: Don't need to accumulate this. Instead, we can remove
                        // ReactFiberHooksCurrent.renderLanes from the original lanes.
                        ReactFiberHooksCurrent.renderingFiber.lanes = mergeLanes( ReactFiberHooksCurrent.renderingFiber.lanes, revertLane );
                        markSkippedUpdateLanes( revertLane );
                    }
                }

                // Process this update.
                const action = update.action;

                if ( ReactFiberHooksInfra.shouldDoubleInvokeUserFnsInHooksDEV ) {
                    reducer( newState, action );
                }

                if ( update.hasEagerState ) {
                    // If this update is a state update (not a reducer) and was processed eagerly,
                    // we can use the eagerly computed state
                    newState = ( ( update.eagerState as any ) as S );
                } else {
                    newState = reducer( newState, action );
                }
            }

            update = update.next;
        } while ( update !== null && update !== first );

        if ( newBaseQueueLast === null ) {
            newBaseState = newState;
        } else {
            newBaseQueueLast.next = ( newBaseQueueFirst as any );
        }

        // Mark that the fiber performed work, but only if the new state is
        // different from the current state.
        if ( ! is( newState, hook.memoizedState ) ) {
            markWorkInProgressReceivedUpdate();
        }

        hook.memoizedState = newState;
        hook.baseState = newBaseState;
        hook.baseQueue = newBaseQueueLast;
        queue.lastRenderedState = newState;
    }

    if ( baseQueue === null ) {
        // `queue.lanes` is used for entangling transitions. We can set it back to
        // zero once the queue is empty.
        queue.lanes = NoLanes;
    }

    const dispatch: Dispatch<A> = ( queue.dispatch as any );
    return [ hook.memoizedState, dispatch ];
}
