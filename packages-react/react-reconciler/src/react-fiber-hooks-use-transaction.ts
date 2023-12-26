import { unstable_now as now } from "@zenflux/react-scheduler";
import { enableAsyncActions, enableTransitionTracing } from "@zenflux/react-shared/src/react-feature-flags";

import ReactSharedInternals from "@zenflux/react-shared/src/react-shared-internals";

import {
    ContinuousEventPriority,
    getCurrentUpdatePriority,
    higherEventPriority,
    setCurrentUpdatePriority
} from "@zenflux/react-reconciler/src/react-event-priorities";

import { requestAsyncActionContext, requestSyncActionContext } from "@zenflux/react-reconciler/src/react-fiber-async-action";
import { mountWorkInProgressHook, updateWorkInProgressHook } from "@zenflux/react-reconciler/src/react-fiber-hooks-infra";
import { ReactFiberHooksCurrent } from "@zenflux/react-reconciler/src/react-fiber-hooks-shared";
import { useThenable } from "@zenflux/react-reconciler/src/react-fiber-hooks-use";
import { dispatchOptimisticSetState } from "@zenflux/react-reconciler/src/react-fiber-hooks-use-optimistic";
import {
    dispatchSetState,
    mountStateImpl,
    rerenderState,
    updateState
} from "@zenflux/react-reconciler/src/react-fiber-hooks-use-state";

import type { BatchConfigTransition } from "@zenflux/react-shared/src/react-internal-types/transition";

import type { BasicStateAction } from "@zenflux/react-reconciler/src/react-fiber-hooks-types";
import type { Fiber, HookUpdateQueue } from "@zenflux/react-shared/src/react-internal-types";
import type { RejectedThenable, StartTransitionOptions, Thenable } from "@zenflux/react-shared/src/react-types";

const {
    ReactCurrentBatchConfig
} = ReactSharedInternals;

export function startTransition<S>( fiber: Fiber, queue: HookUpdateQueue<S | Thenable<S>, BasicStateAction<S | Thenable<S>>>, pendingState: S, finishedState: S, callback: () => unknown, options?: StartTransitionOptions ): void {
    const previousPriority = getCurrentUpdatePriority();
    setCurrentUpdatePriority( higherEventPriority( previousPriority, ContinuousEventPriority ) );
    const prevTransition = ReactCurrentBatchConfig.transition;
    const currentTransition: BatchConfigTransition = {};

    if ( enableAsyncActions ) {
        // We don't really need to use an optimistic update here, because we
        // schedule a second "revert" update below (which we use to suspend the
        // transition until the async action scope has finished). But we'll use an
        // optimistic update anyway to make it less likely the behavior accidentally
        // diverges; for example, both an optimistic update and this one should
        // share the same lane.
        ReactCurrentBatchConfig.transition = currentTransition;
        dispatchOptimisticSetState( fiber, false, queue, pendingState );
    } else {
        ReactCurrentBatchConfig.transition = null;
        dispatchSetState( fiber, queue, pendingState );
        ReactCurrentBatchConfig.transition = currentTransition;
    }

    if ( enableTransitionTracing ) {
        if ( options !== undefined && options.name !== undefined ) {
            ReactCurrentBatchConfig.transition.name = options.name;
            ReactCurrentBatchConfig.transition.startTime = now();
        }
    }

    if ( __DEV__ ) {
        ReactCurrentBatchConfig.transition._updatedFibers = new Set();
    }

    try {
        if ( enableAsyncActions ) {
            const returnValue = callback();

            // Check if we're inside an async action scope. If so, we'll entangle
            // this new action with the existing scope.
            //
            // If we're not already inside an async action scope, and this action is
            // async, then we'll create a new async scope.
            //
            // In the async case, the resulting render will suspend until the async
            // action scope has finished.
            if ( returnValue !== null && typeof returnValue === "object" && typeof ( returnValue as Thenable<any> ).then === "function" ) {
                const thenable = ( ( returnValue as any ) as Thenable<unknown> );
                // This is a thenable that resolves to `finishedState` once the async
                // action scope has finished.
                const entangledResult = requestAsyncActionContext( thenable, finishedState );
                dispatchSetState( fiber, queue, entangledResult );
            } else {
                // This is either `finishedState` or a thenable that resolves to
                // `finishedState`, depending on whether we're inside an async
                // action scope.
                const entangledResult = requestSyncActionContext( returnValue, finishedState );
                dispatchSetState( fiber, queue, entangledResult );
            }
        } else {
            // Async actions are not enabled.
            dispatchSetState( fiber, queue, finishedState );
            callback();
        }
    } catch ( error ) {
        if ( enableAsyncActions ) {
            // This is a trick to get the `useTransition` hook to rethrow the error.
            // When it unwraps the thenable with the `use` algorithm, the error
            // will be thrown.
            const rejectedThenable: RejectedThenable<S> = {
                then() {
                },

                status: "rejected",
                reason: error
            };
            dispatchSetState( fiber, queue, rejectedThenable );
        } else {
            // The error rethrowing behavior is only enabled when the async actions
            // feature is on, even for sync actions.
            throw error;
        }
    } finally {
        setCurrentUpdatePriority( previousPriority );
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

export function mountTransition(): [ boolean, ( callback: () => void, options?: StartTransitionOptions ) => void ] {
    const stateHook = mountStateImpl( ( false as Thenable<boolean> | boolean ) );
    // The `start` method never changes.
    const start = startTransition.bind( null, ReactFiberHooksCurrent.renderingFiber, stateHook.queue, true, false );
    const hook = mountWorkInProgressHook();
    hook.memoizedState = start;
    return [ false, start ];
}

export function updateTransition(): [ boolean, ( callback: () => void, options?: StartTransitionOptions ) => void ] {
    const [ booleanOrThenable ] = updateState( false );
    const hook = updateWorkInProgressHook();
    const start = hook.memoizedState;
    const isPending = typeof booleanOrThenable === "boolean" ? booleanOrThenable : // This will suspend until the async action scope has finished.
        useThenable<boolean>( booleanOrThenable );
    return [ isPending, start ];
}

export function rerenderTransition(): [ boolean, ( callback: () => void, options?: StartTransitionOptions ) => void ] {
    const [ booleanOrThenable ] = rerenderState( false );
    const hook = updateWorkInProgressHook();
    const start = hook.memoizedState;
    const isPending = typeof booleanOrThenable === "boolean" ? booleanOrThenable : // This will suspend until the async action scope has finished.
        useThenable<boolean>( booleanOrThenable );
    return [ isPending, start ];
}
