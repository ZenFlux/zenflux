import is from "@zenflux/react-shared/src/object-is";

import ReactSharedInternals from "@zenflux/react-shared/src/react-shared-internals";

import { NoLane, NoLanes } from "@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants";

import { entangleTransitionUpdate } from "@zenflux/react-reconciler/src/react-entangled-transaction";

import {
    enqueueConcurrentHookUpdate,
    enqueueConcurrentHookUpdateAndEagerlyBailout
} from "@zenflux/react-reconciler/src/react-fiber-concurrent-updates";
import {
    enqueueRenderPhaseUpdate,
    isRenderPhaseUpdate,
    markUpdateInDevTools,
    mountWorkInProgressHook,
} from "@zenflux/react-reconciler/src/react-fiber-hooks-infra";
import {
    ReactFiberHooksCurrent,
    ReactFiberHooksInvalidNestedHooksDispatcherInDEV
} from "@zenflux/react-reconciler/src/react-fiber-hooks-shared";
import { rerenderReducer, updateReducer } from "@zenflux/react-reconciler/src/react-fiber-hooks-use-reducer";

import { requestUpdateLane } from "@zenflux/react-reconciler/src/react-fiber-work-in-progress-request-lane";
import { scheduleUpdateOnFiber } from "@zenflux/react-reconciler/src/react-fiber-work-schedule-update";

import type {
    BasicStateAction,
    Dispatch,
    Hook,
    SetStateAction,
} from "@zenflux/react-reconciler/src/react-fiber-hooks-types";
import type { Fiber, HookUpdateQueue } from "@zenflux/react-shared/src/react-internal-types";
import type { HookUpdate } from "@zenflux/react-shared/src/react-internal-types/update";

const {
    ReactCurrentDispatcher,
} = ReactSharedInternals;

export function basicStateReducer<S>( state: S, action: BasicStateAction<S> ): S {
    // $FlowFixMe[incompatible-use]: Flow doesn't like mixed types
    // @ts-ignore
    return typeof action === "function" ? action( state ) : action;
}

export function updateState<S>( initialState: S ): [ S, Dispatch<SetStateAction<S>> ];
export function updateState<S = undefined>(): [ S, Dispatch<SetStateAction<S> | undefined> ];
export function updateState( initialState?: any ): any {
    return updateReducer( basicStateReducer, initialState );
}

export function rerenderState<S>( initialState: S ): [ S, Dispatch<SetStateAction<S>> ];
export function rerenderState<S = undefined>(): [ S, Dispatch<SetStateAction<S> | undefined> ];
export function rerenderState( initialState?: any ): any {
    return rerenderReducer( basicStateReducer, initialState );
}

export function mountStateImpl<S>( initialState: ( () => S ) | S ): Hook {
    const hook = mountWorkInProgressHook();

    if ( typeof initialState === "function" ) {
        // $FlowFixMe[incompatible-use]: Flow doesn't like mixed types
        // @ts-ignore
        initialState = initialState();
    }

    hook.memoizedState = hook.baseState = initialState;
    const queue: HookUpdateQueue<S, BasicStateAction<S>> = {
        pending: null,
        lanes: NoLanes,
        dispatch: null,
        lastRenderedReducer: basicStateReducer,
        lastRenderedState: ( initialState as any )
    };
    hook.queue = queue;
    return hook;
}

export function mountState<S = undefined>(): [ S | undefined, Dispatch<SetStateAction<S | undefined>> ];
export function mountState<S>( initialState: ( () => S ) | S ): [ S, Dispatch<BasicStateAction<S>> ];
export function mountState<S>( initialState?: ( () => S ) | S ): [ S, Dispatch<BasicStateAction<S>> ] {
    const hook = mountStateImpl( initialState );
    const queue = hook.queue;
    const dispatch: Dispatch<BasicStateAction<S>> = ( dispatchSetState.bind( null, ReactFiberHooksCurrent.renderingFiber, queue ) as any );
    queue.dispatch = dispatch;
    return [ hook.memoizedState, dispatch ];
};

export function dispatchSetState<S, A>( fiber: Fiber, queue: HookUpdateQueue<S, A>, action: A ): void {
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
        const alternate = fiber.alternate;

        if ( fiber.lanes === NoLanes && ( alternate === null || alternate.lanes === NoLanes ) ) {
            // The queue is currently empty, which means we can eagerly compute the
            // next state before entering the render phase. If the new state is the
            // same as the current state, we may be able to bail out entirely.
            const lastRenderedReducer = queue.lastRenderedReducer;

            if ( lastRenderedReducer !== null ) {
                let prevDispatcher;

                if ( __DEV__ ) {
                    prevDispatcher = ReactCurrentDispatcher.current;
                    ReactCurrentDispatcher.current = ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onUpdate;
                }

                try {
                    const currentState: S = ( queue.lastRenderedState as any );
                    const eagerState = lastRenderedReducer( currentState, action );
                    // Stash the eagerly computed state, and the reducer used to compute
                    // it, on the update object. If the reducer hasn't changed by the
                    // time we enter the render phase, then the eager state can be used
                    // without calling the reducer again.
                    update.hasEagerState = true;
                    update.eagerState = eagerState;

                    if ( is( eagerState, currentState ) ) {
                        // Fast path. We can bail out without scheduling React to re-render.
                        // It's still possible that we'll need to rebase this update later,
                        // if the component re-renders for a different reason and by that
                        // time the reducer has changed.
                        // TODO: Do we still need to entangle transitions in this case?
                        enqueueConcurrentHookUpdateAndEagerlyBailout( fiber, queue, update );
                        return;
                    }
                } catch ( error ) {// Suppress the error. It will throw again in the render phase.
                } finally {
                    if ( __DEV__ ) {
                        ReactCurrentDispatcher.current = prevDispatcher ?? null;
                    }
                }
            }
        }

        const root = enqueueConcurrentHookUpdate( fiber, queue, update, lane );

        if ( root !== null ) {
            scheduleUpdateOnFiber( root, fiber, lane );
            entangleTransitionUpdate( root, queue, lane );
        }
    }

    markUpdateInDevTools( fiber, lane, action );
}
