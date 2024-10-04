
import type { TransitionStatus } from "@zenflux/react-shared/src/react-internal-types/transition";

import type {
    useCallback,
    useDebugValue,
    useDeferredValue,
    useEffect,
    useId,
    useImperativeHandle,
    useInsertionEffect,
    useLayoutEffect,
    useMemo,
    useReducer,
    useRef,
    useState,
    useSyncExternalStore,
    useTransition,
} from "react";

import type { ReactContext, Usable } from "@zenflux/react-shared/src/react-types";

export type Dispatcher = {
    use: <T>( usable: Usable<T> ) => T;
    readContext<T>( context: ReactContext<T> ): T;
    useState: typeof useState;
    useReducer: typeof useReducer;
    useContext<T>( context: ReactContext<T> ): T
    useRef: typeof useRef;
    useEffect: typeof useEffect;
    useEffectEvent?: <T extends Function>( callback: T ) => T;
    useInsertionEffect: typeof useInsertionEffect;
    useLayoutEffect: typeof useLayoutEffect;
    useCallback: typeof useCallback;
    useMemo: typeof useMemo;
    useImperativeHandle: typeof useImperativeHandle;
    useDebugValue: typeof useDebugValue;
    useDeferredValue: typeof useDeferredValue;
    useTransition: typeof useTransition;
    useSyncExternalStore: typeof useSyncExternalStore;
    useId: typeof useId;
    useCacheRefresh?: <T>( fetch: ( () => T ) | T, cachedValue?: T ) => void;
    useMemoCache?: ( size: number ) => unknown[];
    useHostTransitionStatus?: () => TransitionStatus;
    useOptimistic?: <S, A>( passthrough: S, reducer?: ( state: S, action: A ) => S ) => [ S, ( action: A ) => void ];
    useFormState?: <State, Payload>(
        action: ( state: Awaited<State>, payload: Payload ) => State,
        initialState: Awaited<State>,
        permalink?: string,
    ) => [ state: Awaited<State>, dispatch: ( payload: Payload ) => void ];
};

export type CacheDispatcher = {
    getCacheSignal: () => AbortSignal;
    getCacheForType: <T>( resourceType: () => T ) => T;
};
