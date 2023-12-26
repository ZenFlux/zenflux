import type { HookUpdate } from "@zenflux/react-shared/src/react-internal-types/update";

export type {
    DispatchWithoutAction,
    MutableRefObject,
    Reducer,
    ReducerAction,
    ReducerState,
    ReducerStateWithoutAction,
    ReducerWithoutAction,
    Ref,
    RefObject,
    SetStateAction
} from "react";

// Find better solution for this
export type DependencyList = ReadonlyArray<unknown>;

export type Hook = {
    memoizedState: any;
    baseState: any;
    baseQueue: HookUpdate<any, any> | null;
    queue: any;
    next: Hook | null;
};

export type BasicStateAction<S> = ( ( arg0: S ) => S ) | S;
export type Dispatch<A> = ( arg0: A ) => void;

// useFormState actions run sequentially, because each action receives the
// previous state as an argument. We store pending actions on a queue.
export type FormStateActionQueue<S, P> = {
    // This is the most recent state returned from an action. It's updated as
    // soon as the action finishes running.
    state: Awaited<S>;
    // A stable dispatch method, passed to the user.
    dispatch: Dispatch<P>;
    // This is the most recent action function that was rendered. It's updated
    // during the commit phase.
    action: ( arg0: Awaited<S>, arg1: P ) => S;
    // This is a circular linked list of pending action payloads. It incudes the
    // action that is currently running.
    pending: FormStateActionQueueNode<P> | null;
};

export type FormStateActionQueueNode<P> = {
    payload: P;
    // This is never null because it's part of a circular linked list.
    next: FormStateActionQueueNode<P>;
};
