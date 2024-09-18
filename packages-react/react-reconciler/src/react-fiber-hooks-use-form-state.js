"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rerenderFormState = exports.updateFormState = exports.mountFormState = void 0;
var react_shared_internals_1 = require("@zenflux/react-shared/src/react-shared-internals");
var fiber_lane_constants_1 = require("@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants");
var hook_flags_1 = require("@zenflux/react-shared/src/react-internal-constants/hook-flags");
var react_fiber_async_action_1 = require("@zenflux/react-reconciler/src/react-fiber-async-action");
var react_fiber_hooks_infra_1 = require("@zenflux/react-reconciler/src/react-fiber-hooks-infra");
var react_fiber_hooks_shared_1 = require("@zenflux/react-reconciler/src/react-fiber-hooks-shared");
var react_fiber_hooks_use_1 = require("@zenflux/react-reconciler/src/react-fiber-hooks-use");
var react_fiber_hooks_use_effect_1 = require("@zenflux/react-reconciler/src/react-fiber-hooks-use-effect");
var react_fiber_hooks_use_reducer_1 = require("@zenflux/react-reconciler/src/react-fiber-hooks-use-reducer");
var react_fiber_hooks_use_state_1 = require("@zenflux/react-reconciler/src/react-fiber-hooks-use-state");
var react_fiber_hydration_context_try_claim_1 = require("@zenflux/react-reconciler/src/react-fiber-hydration-context-try-claim");
var react_fiber_hydration_is_hydrating_1 = require("@zenflux/react-reconciler/src/react-fiber-hydration-is-hydrating");
var react_fiber_work_in_progress_1 = require("@zenflux/react-reconciler/src/react-fiber-work-in-progress");
var fiber_flags_1 = require("@zenflux/react-shared/src/react-internal-constants/fiber-flags");
var ReactCurrentBatchConfig = react_shared_internals_1.default.ReactCurrentBatchConfig;
function dispatchFormState(fiber, actionQueue, setState, payload) {
    if ((0, react_fiber_hooks_infra_1.isRenderPhaseUpdate)(fiber)) {
        throw new Error("Cannot update form state while rendering.");
    }
    var last = actionQueue.pending;
    if (last === null) {
        // There are no pending actions; this is the first one. We can run
        // it immediately.
        var newLast = {
            payload: payload,
            next: null // circular
        };
        newLast.next = actionQueue.pending = newLast;
        runFormStateAction(actionQueue, setState, payload);
    }
    else {
        // There's already an action running. Add to the queue.
        var first = last.next;
        var newLast = {
            payload: payload,
            next: first
        };
        actionQueue.pending = last.next = newLast;
    }
}
function runFormStateAction(actionQueue, setState, payload) {
    var action = actionQueue.action;
    var prevState = actionQueue.state;
    // This is a fork of startTransition
    var prevTransition = ReactCurrentBatchConfig.transition;
    ReactCurrentBatchConfig.transition = {};
    var currentTransition = ReactCurrentBatchConfig.transition;
    if (__DEV__) {
        ReactCurrentBatchConfig.transition._updatedFibers = new Set();
    }
    try {
        var returnValue = action(prevState, payload);
        if (returnValue !== null && typeof returnValue === "object" && // $FlowFixMe[method-unbinding]
            // @ts-ignore
            typeof returnValue.then === "function") {
            var thenable = returnValue;
            // Attach a listener to read the return state of the action. As soon as
            // this resolves, we can run the next action in the sequence.
            thenable.then(function (nextState) {
                actionQueue.state = nextState;
                finishRunningFormStateAction(actionQueue, setState);
            }, function () { return finishRunningFormStateAction(actionQueue, setState); });
            var entangledResult = (0, react_fiber_async_action_1.requestAsyncActionContext)(thenable, null);
            setState(entangledResult);
        }
        else {
            // This is either `returnValue` or a thenable that resolves to
            // `returnValue`, depending on whether we're inside an async action scope.
            var entangledResult = (0, react_fiber_async_action_1.requestSyncActionContext)(returnValue, null);
            setState(entangledResult);
            var nextState = returnValue;
            actionQueue.state = nextState;
            finishRunningFormStateAction(actionQueue, setState);
        }
    }
    catch (error) {
        // This is a trick to get the `useFormState` hook to rethrow the error.
        // When it unwraps the thenable with the `use` algorithm, the error
        // will be thrown.
        var rejectedThenable = {
            then: function () {
            },
            status: "rejected",
            reason: error // $FlowFixMe: Not sure why this doesn't work
        };
        setState(rejectedThenable);
        finishRunningFormStateAction(actionQueue, setState);
    }
    finally {
        ReactCurrentBatchConfig.transition = prevTransition;
        if (__DEV__) {
            if (prevTransition === null && currentTransition._updatedFibers) {
                var updatedFibersCount = currentTransition._updatedFibers.size;
                currentTransition._updatedFibers.clear();
                if (updatedFibersCount > 10) {
                    console.warn("Detected a large number of updates inside startTransition. " + "If this is due to a subscription please re-write it to use React provided hooks. " + "Otherwise concurrent mode guarantees are off the table.");
                }
            }
        }
    }
}
function finishRunningFormStateAction(actionQueue, setState) {
    // The action finished running. Pop it from the queue and run the next pending
    // action, if there are any.
    var last = actionQueue.pending;
    if (last !== null) {
        var first = last.next;
        if (first === last) {
            // This was the last action in the queue.
            actionQueue.pending = null;
        }
        else {
            // Remove the first node from the circular queue.
            var next = first.next;
            last.next = next;
            // Run the next action.
            runFormStateAction(actionQueue, setState, next.payload);
        }
    }
}
function formStateReducer(oldState, newState) {
    return newState;
}
function mountFormState(action, initialStateProp, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
permalink) {
    var initialState = initialStateProp;
    if ((0, react_fiber_hydration_is_hydrating_1.isHydrating)()) {
        var root = (0, react_fiber_work_in_progress_1.getWorkInProgressRoot)();
        var ssrFormState = root.formState;
        // If a formState option was passed to the root, there are form state
        // markers that we need to hydrate. These indicate whether the form state
        // matches this hook instance.
        if (ssrFormState !== null) {
            var isMatching = (0, react_fiber_hydration_context_try_claim_1.tryToClaimNextHydratableFormMarkerInstance)(react_fiber_hooks_shared_1.ReactFiberHooksCurrent.renderingFiber);
            if (isMatching) {
                initialState = ssrFormState[0];
            }
        }
    }
    // State hook. The state is stored in a thenable which is then unwrapped by
    // the `use` algorithm during render.
    var stateHook = (0, react_fiber_hooks_infra_1.mountWorkInProgressHook)();
    stateHook.memoizedState = stateHook.baseState = initialState;
    // TODO: Typing this "correctly" results in recursion limit errors
    // const stateQueue: UpdateQueue<S | Awaited<S>, S | Awaited<S>> = {
    var stateQueue = {
        pending: null,
        lanes: fiber_lane_constants_1.NoLanes,
        dispatch: null,
        lastRenderedReducer: formStateReducer,
        lastRenderedState: initialState
    };
    stateHook.queue = stateQueue;
    var setState = react_fiber_hooks_use_state_1.dispatchSetState.bind(null, react_fiber_hooks_shared_1.ReactFiberHooksCurrent.renderingFiber, stateQueue);
    stateQueue.dispatch = setState;
    // Action queue hook. This is used to queue pending actions. The queue is
    // shared between all instances of the hook. Similar to a regular state queue,
    // but different because the actions are run sequentially, and they run in
    // an event instead of during render.
    var actionQueueHook = (0, react_fiber_hooks_infra_1.mountWorkInProgressHook)();
    var actionQueue = {
        state: initialState,
        dispatch: null,
        // circular
        action: action,
        pending: null
    };
    actionQueueHook.queue = actionQueue;
    var dispatch = dispatchFormState.bind(null, react_fiber_hooks_shared_1.ReactFiberHooksCurrent.renderingFiber, actionQueue, setState);
    actionQueue.dispatch = dispatch;
    // Stash the action function on the memoized state of the hook. We'll use this
    // to detect when the action function changes so we can update it in
    // an effect.
    actionQueueHook.memoizedState = action;
    return [initialState, dispatch];
}
exports.mountFormState = mountFormState;
function updateFormState(action, initialState, permalink) {
    var stateHook = (0, react_fiber_hooks_infra_1.updateWorkInProgressHook)();
    var currentStateHook = react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hook;
    /**
     * Argument of type '(state: Awaited<State> | Promise<Awaited<State>>, payload: Payload) => State | Promise<State>' is not assignable to parameter of type '(state: Awaited<Awaited<State>> | Awaited<Awaited<State>>, params: Payload) => Awaited<State> | Promise<...> | Promise<...>'.
     *   Type 'State | Promise<State>' is not assignable to type 'Awaited<State> | Promise<Awaited<State>> | Promise<Awaited<State> | Promise<Awaited<State>>>'.
     *     Type 'State' is not assignable to type 'Awaited<State> | Promise<Awaited<State>> | Promise<Awaited<State> | Promise<Awaited<State>>>'.
     *       Type 'State' is not assignable to type 'Promise<Awaited<State> | Promise<Awaited<State>>>'.
     */
    // @ts-ignore
    return updateFormStateImpl(stateHook, currentStateHook, action, initialState, permalink);
}
exports.updateFormState = updateFormState;
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
function updateFormStateImpl(stateHook, currentStateHook, action, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
initialState, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
permalink) {
    var actionResult = (0, react_fiber_hooks_use_reducer_1.updateReducerImpl)(stateHook, currentStateHook, formStateReducer)[0];
    // This will suspend until the action finishes.
    var state = typeof actionResult === "object" &&
        actionResult !== null &&
        // $FlowFixMe[method-unbinding]
        typeof actionResult.then === "function"
        ? (0, react_fiber_hooks_use_1.useThenable)(actionResult)
        : actionResult;
    var actionQueueHook = (0, react_fiber_hooks_infra_1.updateWorkInProgressHook)();
    var actionQueue = actionQueueHook.queue;
    var dispatch = actionQueue.dispatch;
    // Check if a new action was passed. If so, update it in an effect.
    var prevAction = actionQueueHook.memoizedState;
    if (action !== prevAction) {
        react_fiber_hooks_shared_1.ReactFiberHooksCurrent.renderingFiber.flags |= fiber_flags_1.FiberFlags.Passive;
        (0, react_fiber_hooks_use_effect_1.pushEffect)(hook_flags_1.HookFlags.HasEffect | hook_flags_1.HookFlags.Passive, formStateActionEffect.bind(null, actionQueue, action), (0, react_fiber_hooks_use_effect_1.createEffectInstance)(), null);
    }
    return [state, dispatch];
}
function formStateActionEffect(actionQueue, action) {
    actionQueue.action = action;
}
function rerenderFormState(action, initialState, permalink) {
    // Unlike useState, useFormState doesn't support render phase updates.
    // Also unlike useState, we need to replay all pending updates again in case
    // the passthrough value changed.
    //
    // So instead of a forked re-render implementation that knows how to handle
    // render phase udpates, we can use the same implementation as during a
    // regular mount or update.
    var stateHook = (0, react_fiber_hooks_infra_1.updateWorkInProgressHook)();
    var currentStateHook = react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hook;
    if (currentStateHook !== null) {
        // This is an update. Process the update queue.
        return updateFormStateImpl(stateHook, currentStateHook, action, initialState, permalink);
    }
    // This is a mount. No updates to process.
    var state = stateHook.memoizedState;
    var actionQueueHook = (0, react_fiber_hooks_infra_1.updateWorkInProgressHook)();
    var actionQueue = actionQueueHook.queue;
    var dispatch = actionQueue.dispatch;
    // This may have changed during the rerender.
    actionQueueHook.memoizedState = action;
    return [state, dispatch];
}
exports.rerenderFormState = rerenderFormState;
