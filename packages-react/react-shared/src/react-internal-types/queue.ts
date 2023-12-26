/* eslint-disable no-restricted-imports */

import type { MemoCache } from "./cache";
import type { EventFunctionPayload } from "./payload";
import type { StoreConsistencyCheck } from "./store";
import type { Effect } from "./effect";

import type { Wakeable } from "@zenflux/react-shared/src/react-types";
import type { Lanes } from "./lanes";
import type { FiberUpdate, HookUpdate } from "./update";

export type RetryQueue = Set<Wakeable>;

export type SharedQueue<State, UpdateType = FiberUpdate<State>> = {
    pending: UpdateType | null;
    lanes: Lanes;
    hiddenCallbacks: Array<Function> | null;
};

export type FiberUpdateQueue<State> = {
    baseState: State;
    firstBaseUpdate: FiberUpdate<State> | null;
    lastBaseUpdate: FiberUpdate<State> | null;
    shared: SharedQueue<State>;
    callbacks: Array<Function> | null
};

export type HookUpdateQueue<S, A> = {
    pending: HookUpdate<S, A> | null;
    lanes: Lanes;
    dispatch: ( ( arg0: A ) => unknown ) | null;
    lastRenderedReducer: ( ( arg0: S, arg1: A ) => S ) | null;
    lastRenderedState: S | null;
};

export type FunctionComponentUpdateQueue = {
    lastEffect: Effect | null;
    events: Array<EventFunctionPayload<any, any, any>> | null;
    stores: Array<StoreConsistencyCheck<any>> | null;
    // NOTE: optional, only set when enableUseMemoCacheHook is enabled
    memoCache?: MemoCache | null;
};
