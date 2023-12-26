/* eslint-disable no-restricted-imports */
import type { Lane } from "./lanes";

export type ConcurrentUpdate = {
    next: ConcurrentUpdate;
    lane: Lane;
};

// Added by zenflux, not sure about the type
export type FiberUpdate<State> = {
    lane: Lane;
    tag: 0 | 1 | 2 | 3;
    payload: any;
    callback: Function | null;
    next: FiberUpdate<State> | null;

    // TODO: Not sure about this
    expirationTime?: number;
};

export type HookUpdate<S, A> = {
    lane: Lane;
    revertLane: Lane;
    action: A;
    hasEagerState: boolean;
    eagerState: S | null;
    next: HookUpdate<S, A>;
};

