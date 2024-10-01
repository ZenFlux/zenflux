import ReactSharedInternals from "@zenflux/react-shared/src/react-shared-internals";

import { NoLanes } from "@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants";

import { HookFlags } from "@zenflux/react-shared/src/react-internal-constants/hook-flags";

import { FiberFlags } from "@zenflux/react-shared/src/react-internal-constants/fiber-flags";

import { requestAsyncActionContext, requestSyncActionContext } from "@zenflux/react-reconciler/src/react-fiber-async-action";
import { isRenderPhaseUpdate, mountWorkInProgressHook, updateWorkInProgressHook } from "@zenflux/react-reconciler/src/react-fiber-hooks-infra";
import { ReactFiberHooksCurrent } from "@zenflux/react-reconciler/src/react-fiber-hooks-shared";
import { useThenable } from "@zenflux/react-reconciler/src/react-fiber-hooks-use";
import { createEffectInstance, pushEffect } from "@zenflux/react-reconciler/src/react-fiber-hooks-use-effect";
import { updateReducerImpl } from "@zenflux/react-reconciler/src/react-fiber-hooks-use-reducer";
import { dispatchSetState } from "@zenflux/react-reconciler/src/react-fiber-hooks-use-state";
import { tryToClaimNextHydratableFormMarkerInstance } from "@zenflux/react-reconciler/src/react-fiber-hydration-context-try-claim";
import { isHydrating } from "@zenflux/react-reconciler/src/react-fiber-hydration-is-hydrating";

import { getWorkInProgressRoot } from "@zenflux/react-reconciler/src/react-fiber-work-in-progress";

import type { Dispatch, FormStateActionQueue, FormStateActionQueueNode, Hook } from "@zenflux/react-reconciler/src/react-fiber-hooks-types";
import type { Fiber, FiberRoot } from "@zenflux/react-shared/src/react-internal-types";
import type { RejectedThenable, Thenable } from "@zenflux/react-shared/src/react-types";
import type { BatchConfigTransition } from "@zenflux/react-shared/src/react-internal-types/transition";

const {
    ReactCurrentBatchConfig
} = ReactSharedInternals;

function dispatchFormState<S, P>( fiber: Fiber, actionQueue: FormStateActionQueue<S, P>, setState: Dispatch<S | Awaited<S>>, payload: P ): void {
    if ( isRenderPhaseUpdate( fiber ) ) {
        throw new Error( "Cannot update form state while rendering." );
    }

    const last = actionQueue.pending;

    if ( last === null ) {
        // There are no pending actions; this is the first one. We can run
        // it immediately.
        const newLast: FormStateActionQueueNode<P> = {
            payload,
            next: ( null as any ) // circular

        };
        newLast.next = actionQueue.pending = newLast;
        runFormStateAction( actionQueue, ( setState as any ), payload );
    } else {
        // There's already an action running. Add to the queue.
        const first = last.next;
        const newLast: FormStateActionQueueNode<P> = {
            payload,
            next: first
        };
        actionQueue.pending = last.next = newLast;
    }
}

function runFormStateAction<S, P>( actionQueue: FormStateActionQueue<S, P>, setState: Dispatch<S | Awaited<S>>, payload: P ) {
    const action = actionQueue.action;
    const prevState = actionQueue.state;
    // This is a fork of startTransition
    const prevTransition = ReactCurrentBatchConfig.transition;
    ReactCurrentBatchConfig.transition = ( {} as BatchConfigTransition );
    const currentTransition = ReactCurrentBatchConfig.transition;

    if ( __DEV__ ) {
        ReactCurrentBatchConfig.transition._updatedFibers = new Set();
    }

    try {
        const returnValue = action( prevState, payload );

        if ( returnValue !== null && typeof returnValue === "object" && // $FlowFixMe[method-unbinding]
            // @ts-ignore
            typeof returnValue.then === "function" ) {
            const thenable = ( ( returnValue as any ) as Thenable<Awaited<S>> );
            // Attach a listener to read the return state of the action. As soon as
            // this resolves, we can run the next action in the sequence.
            thenable.then( ( nextState: Awaited<S> ) => {
                actionQueue.state = nextState;
                finishRunningFormStateAction( actionQueue, ( setState as any ) );
            }, () => finishRunningFormStateAction( actionQueue, ( setState as any ) ) );
            const entangledResult = requestAsyncActionContext<S>( thenable, null );
            setState( ( entangledResult as any ) );
        } else {
            // This is either `returnValue` or a thenable that resolves to
            // `returnValue`, depending on whether we're inside an async action scope.
            const entangledResult = requestSyncActionContext<S>( returnValue, null );
            setState( ( entangledResult as any ) );
            const nextState = ( ( returnValue as any ) as Awaited<S> );
            actionQueue.state = nextState;
            finishRunningFormStateAction( actionQueue, ( setState as any ) );
        }
    } catch ( error ) {
        // This is a trick to get the `useFormState` hook to rethrow the error.
        // When it unwraps the thenable with the `use` algorithm, the error
        // will be thrown.
        const rejectedThenable = ( {
            then() {
            },

            status: "rejected",
            reason: error // $FlowFixMe: Not sure why this doesn't work

        } as RejectedThenable<Awaited<S>> );
        setState( rejectedThenable as S );
        finishRunningFormStateAction( actionQueue, ( setState as any ) );
    } finally {
        ReactCurrentBatchConfig.transition = prevTransition;

        if ( __DEV__ ) {
            if ( prevTransition === null && currentTransition._updatedFibers ) {
                const updatedFibersCount = currentTransition._updatedFibers.size;

                currentTransition._updatedFibers.clear();

                if ( updatedFibersCount > 10 ) {
                    console.warn( "Detected a large number of updates inside startTransition. " + "If this is due to a subscription please re-write it to use React provided hooks. " + "Otherwise concurrent mode guarantees are off the table." );
                }
            }
        }
    }
}

function finishRunningFormStateAction<S, P>( actionQueue: FormStateActionQueue<S, P>, setState: Dispatch<S | Awaited<S>> ) {
    // The action finished running. Pop it from the queue and run the next pending
    // action, if there are any.
    const last = actionQueue.pending;

    if ( last !== null ) {
        const first = last.next;

        if ( first === last ) {
            // This was the last action in the queue.
            actionQueue.pending = null;
        } else {
            // Remove the first node from the circular queue.
            const next = first.next;
            last.next = next;
            // Run the next action.
            runFormStateAction( actionQueue, ( setState as any ), next.payload );
        }
    }
}

function formStateReducer<S>( oldState: S, newState: S ): S {
    return newState;
}

export function mountFormState<State, Payload>( action: ( state: Awaited<State>, payload: Payload ) => State, initialState: Awaited<State>, permalink?: string ): [ state: Awaited<State>, dispatch: ( payload: Payload ) => void ];
export function mountFormState<State, Payload>( action: ( state: Awaited<State> | Promise<Awaited<State>>, payload: Payload ) => State | Promise<State>, initialState: Awaited<State>, permalink?: string ): [ state: Awaited<State>, dispatch: ( payload: Payload ) => void ];
export function mountFormState<State, Payload>(
    action: ( state: Awaited<State>, payload: Payload ) => State,
    initialStateProp: Awaited<State>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    permalink?: string,
): [ state: Awaited<State>, dispatch: ( payload: Payload ) => void ] {
    let initialState = initialStateProp;

    if ( isHydrating() ) {
        const root: FiberRoot = ( getWorkInProgressRoot() as any );
        const ssrFormState = root.formState;

        // If a formState option was passed to the root, there are form state
        // markers that we need to hydrate. These indicate whether the form state
        // matches this hook instance.
        if ( ssrFormState !== null ) {
            const isMatching = tryToClaimNextHydratableFormMarkerInstance( ReactFiberHooksCurrent.renderingFiber );

            if ( isMatching ) {
                initialState = ssrFormState[ 0 ];
            }
        }
    }

    // State hook. The state is stored in a thenable which is then unwrapped by
    // the `use` algorithm during render.
    const stateHook = mountWorkInProgressHook();
    stateHook.memoizedState = stateHook.baseState = initialState;
    // TODO: Typing this "correctly" results in recursion limit errors
    // const stateQueue: UpdateQueue<S | Awaited<S>, S | Awaited<S>> = {
    const stateQueue = {
        pending: null,
        lanes: NoLanes,
        dispatch: ( null as any ),
        lastRenderedReducer: formStateReducer,
        lastRenderedState: initialState
    };
    stateHook.queue = stateQueue;
    const setState: Dispatch<State | Awaited<State>> = ( dispatchSetState.bind( null, ReactFiberHooksCurrent.renderingFiber, ( ( stateQueue as any ) ) ) as any );
    stateQueue.dispatch = setState;
    // Action queue hook. This is used to queue pending actions. The queue is
    // shared between all instances of the hook. Similar to a regular state queue,
    // but different because the actions are run sequentially, and they run in
    // an event instead of during render.
    const actionQueueHook = mountWorkInProgressHook();
    const actionQueue: FormStateActionQueue<State, Payload> = {
        state: initialState,
        dispatch: ( null as any ),
        // circular
        action,
        pending: null
    };
    actionQueueHook.queue = actionQueue;
    const dispatch = ( dispatchFormState as any ).bind( null, ReactFiberHooksCurrent.renderingFiber, actionQueue, setState );
    actionQueue.dispatch = dispatch;
    // Stash the action function on the memoized state of the hook. We'll use this
    // to detect when the action function changes so we can update it in
    // an effect.
    actionQueueHook.memoizedState = action;
    return [ initialState, dispatch ];
}

export function updateFormState<State, Payload>( action: ( state: Awaited<State>, payload: Payload ) => State, initialState: Awaited<State>, permalink?: string ): [ state: Awaited<State>, dispatch: ( payload: Payload ) => void ];
export function updateFormState<State, Payload>( action: ( state: Awaited<State> | Promise<Awaited<State>>, payload: Payload ) => State | Promise<State>, initialState: Awaited<State>, permalink?: string ): [ state: Awaited<State>, dispatch: ( payload: Payload ) => void ];
export function updateFormState<State, Payload>(
    action: ( state: Awaited<State> | Promise<Awaited<State>>, payload: Payload ) => State | Promise<State>,
    initialState: Awaited<State>,
    permalink?: string
): [ state: Awaited<State> | Promise<Awaited<State>>, dispatch: ( payload: Payload ) => void ] {
    const stateHook = updateWorkInProgressHook();
    const currentStateHook = ( ReactFiberHooksCurrent.hook as any ) as Hook;

    /**
     * Argument of type '(state: Awaited<State> | Promise<Awaited<State>>, payload: Payload) => State | Promise<State>' is not assignable to parameter of type '(state: Awaited<Awaited<State>> | Awaited<Awaited<State>>, params: Payload) => Awaited<State> | Promise<...> | Promise<...>'.
     *   Type 'State | Promise<State>' is not assignable to type 'Awaited<State> | Promise<Awaited<State>> | Promise<Awaited<State> | Promise<Awaited<State>>>'.
     *     Type 'State' is not assignable to type 'Awaited<State> | Promise<Awaited<State>> | Promise<Awaited<State> | Promise<Awaited<State>>>'.
     *       Type 'State' is not assignable to type 'Promise<Awaited<State> | Promise<Awaited<State>>>'.
     */
    // @ts-ignore
    return updateFormStateImpl( stateHook, currentStateHook, action, initialState, permalink );
}

// function updateFormStateImpl<S, P>( stateHook: Hook, currentStateHook: Hook, action: ( arg0: Awaited<S>, arg1: P ) => S, initialState: Awaited<S>, permalink?: string ): [ Awaited<S>, ( arg0: P ) => void ] {
//     const [ actionResult ] = updateReducerImpl<S | Thenable<S>, S | Thenable<S>>( stateHook, currentStateHook, formStateReducer );
//     // This will suspend until the action finishes.
//     const state: Awaited<S> = typeof actionResult === 'object' && actionResult !== null && // $FlowFixMe[method-unbinding]
//     typeof actionResult.then === 'function' ? useThenable( ( ( actionResult as any ) as Thenable<Awaited<S>> ) ) : ( actionResult as any );
//     const actionQueueHook = updateWorkInProgressHook();
//     const actionQueue = actionQueueHook.queue;
//     const dispatch = actionQueue.dispatch;
//     // Check if a new action was passed. If so, update it in an effect.
//     const prevAction = actionQueueHook.memoizedState;
//
//     if ( action !== prevAction ) {
//         ReactFiberHooksCurrent.renderingFiber.flags |= HookFlags.Passive;
//         pushEffect( HookFlags.HasEffect | HookFlags.Passive, formStateActionEffect.bind( null, actionQueue, action ), createEffectInstance(), null );
//     }
//
//     return [ state, dispatch ];
// }

function updateFormStateImpl<S, P>(
    stateHook: Hook,
    currentStateHook: Hook,
    action: ( state: Awaited<S>, params: P ) => S | Promise<S>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    initialState: Awaited<S>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    permalink?: string
): [ Awaited<S>, ( params: P ) => void ] {
    const [ actionResult ] = updateReducerImpl<S | Thenable<S>, S | Thenable<S>>(
        stateHook,
        currentStateHook,
        formStateReducer
    );

    // This will suspend until the action finishes.
    const state: Awaited<S> =
        typeof actionResult === "object" &&
        actionResult !== null &&
        // $FlowFixMe[method-unbinding]
        typeof ( actionResult as Thenable<Awaited<S>> ).then === "function"
            ? useThenable( ( actionResult as Thenable<Awaited<S>> ) )
            : ( actionResult as Awaited<S> );

    const actionQueueHook = updateWorkInProgressHook();
    const actionQueue = actionQueueHook.queue;
    const dispatch = actionQueue.dispatch;

    // Check if a new action was passed. If so, update it in an effect.
    const prevAction = actionQueueHook.memoizedState;
    if ( action !== prevAction ) {
        ReactFiberHooksCurrent.renderingFiber.flags |= FiberFlags.Passive;
        pushEffect(
            HookFlags.HasEffect | HookFlags.Passive,
            formStateActionEffect.bind( null, actionQueue, action ),
            createEffectInstance(),
            null
        );
    }

    return [ state, dispatch ];
}

function formStateActionEffect<S, P>(
    actionQueue: FormStateActionQueue<S, P>,
    action: ( ... args: any ) => S,
): void {
    actionQueue.action = action;
}

export function rerenderFormState<State, Payload>( action: ( state: Awaited<State>, payload: Payload ) => State, initialState: Awaited<State>, permalink?: string ): [ state: Awaited<State>, dispatch: ( payload: Payload ) => void ];
export function rerenderFormState<State, Payload>( action: ( state: Awaited<State> | Promise<Awaited<State>>, payload: Payload ) => State | Promise<State>, initialState: Awaited<State>, permalink?: string ): [ state: Awaited<State>, dispatch: ( payload: Payload ) => void ];
export function rerenderFormState<State, Payload>(
    action: ( state: Awaited<State>, payload: Payload ) => State | Promise<State>,
    initialState: Awaited<State>,
    permalink?: string,
): [ state: Awaited<State>, dispatch: ( payload: Payload ) => void ] {
    // Unlike useState, useFormState doesn't support render phase updates.
    // Also unlike useState, we need to replay all pending updates again in case
    // the passthrough value changed.
    //
    // So instead of a forked re-render implementation that knows how to handle
    // render phase udpates, we can use the same implementation as during a
    // regular mount or update.
    const stateHook = updateWorkInProgressHook();
    const currentStateHook = ReactFiberHooksCurrent.hook;

    if ( currentStateHook !== null ) {
        // This is an update. Process the update queue.
        return updateFormStateImpl( stateHook, currentStateHook, action, initialState, permalink );
    }

    // This is a mount. No updates to process.
    const state: Awaited<State> = stateHook.memoizedState;
    const actionQueueHook = updateWorkInProgressHook();
    const actionQueue = actionQueueHook.queue;
    const dispatch = actionQueue.dispatch;
    // This may have changed during the rerender.
    actionQueueHook.memoizedState = action;
    return [ state, dispatch ];
}
