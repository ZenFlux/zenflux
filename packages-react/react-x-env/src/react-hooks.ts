/* Taken from packages/react */
import "@zenflux/react-x-env/internals";

import type { Dispatcher } from "@zenflux/react-reconciler/src/react-internal-types";

import type { ReactContext, StartTransitionOptions, Usable } from "@zenflux/react-shared/src/react-types";

import type { DependencyList, Ref } from "@zenflux/react-reconciler/src/react-fiber-hooks-types";

const {
    ReactCurrentDispatcher,
    ReactCurrentCache,
} = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;

type BasicStateAction<S> = ( ( arg0: S ) => S ) | S;
type Dispatch<A> = ( arg0: A ) => void;

function resolveDispatcher() {
    const dispatcher = ReactCurrentDispatcher.current;

    if ( __DEV__ ) {
        if ( dispatcher === null ) {
            console.error( "Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for" + " one of the following reasons:\n" + "1. You might have mismatching versions of React and the renderer (such as React DOM)\n" + "2. You might be breaking the Rules of Hooks\n" + "3. You might have more than one copy of React in the same app\n" + "See https://reactjs.org/link/invalid-hook-call for tips about how to debug and fix this problem." );
        }
    }

    // Will result in a null access error if accessed outside render phase. We
    // intentionally don't throw our own error because this is in a hot path.
    // Also helps ensure this is inlined.
    return ( ( dispatcher as any ) as Dispatcher );
}

export function getCacheSignal(): AbortSignal {
    const dispatcher = ReactCurrentCache.current;

    if ( ! dispatcher ) {
        // If we have no cache to associate with this call, then we don't know
        // its lifetime. We abort early since that's safer than letting it live
        // for ever. Unlike just caching which can be a functional noop outside
        // of React, these should generally always be associated with some React
        // render but we're not limiting quite as much as making it a Hook.
        // It's safer than erroring early at runtime.
        const controller = new AbortController();
        const reason = new Error( "This CacheSignal was requested outside React which means that it is " + "immediately aborted." );
        controller.abort( reason );
        return controller.signal;
    }

    return dispatcher.getCacheSignal();
}

export function getCacheForType<T>( resourceType: () => T ): T {
    const dispatcher = ReactCurrentCache.current;

    if ( ! dispatcher ) {
        // If there is no dispatcher, then we treat this as not being cached.
        return resourceType();
    }

    return dispatcher.getCacheForType( resourceType );
}

export function useContext<T>( Context: ReactContext<T> ): T {
    const dispatcher = resolveDispatcher();

    if ( __DEV__ ) {
        // TODO: add a more generic warning for invalid values.
        if ( ( Context as any )._context !== undefined ) {
            const realContext = ( Context as any )._context;

            // Don't deduplicate because this legitimately causes bugs
            // and nobody should be using this in existing code.
            if ( realContext.Consumer === Context ) {
                console.error( "Calling useContext(Context.Consumer) is not supported, may cause bugs, and will be " + "removed in a future major release. Did you mean to call useContext(Context) instead?" );
            } else if ( realContext.Provider === Context ) {
                console.error( "Calling useContext(Context.Provider) is not supported. " + "Did you mean to call useContext(Context) instead?" );
            }
        }
    }

    return dispatcher.useContext( Context );
}

export function useState<S>( initialState: ( () => S ) | S ): [ S, Dispatch<BasicStateAction<S>> ] {
    const dispatcher = resolveDispatcher();
    return dispatcher.useState( initialState );
}

export function useReducer<S, I, A>( reducer: ( arg0: S, arg1: A ) => S, initialArg: I, init?: ( arg0: I ) => S ): [ S, Dispatch<A> ] {
    const dispatcher = resolveDispatcher();
    // @ts-ignore - types mismatch
    return dispatcher.useReducer( reducer, initialArg, init );
}

export function useRef<T>( initialValue: T ): {
    current: T;
} {
    const dispatcher = resolveDispatcher();
    return dispatcher.useRef( initialValue );
}

export function useEffect( create: () => ( () => void ) | void, deps: DependencyList ): void {
    const dispatcher = resolveDispatcher();
    return dispatcher.useEffect( create, deps );
}

export function useInsertionEffect( create: () => ( () => void ) | void, deps: DependencyList ): void {
    const dispatcher = resolveDispatcher();
    return dispatcher.useInsertionEffect( create, deps );
}

export function useLayoutEffect( create: () => ( () => void ) | void, deps: DependencyList ): void {
    const dispatcher = resolveDispatcher();
    return dispatcher.useLayoutEffect( create, deps );
}

export function useCallback<T extends Function>( callback: T, deps: DependencyList ): T {
    const dispatcher = resolveDispatcher();
    return dispatcher.useCallback( callback, deps );
}

export function useMemo<T>( create: () => T, deps: DependencyList ): T {
    const dispatcher = resolveDispatcher();
    return dispatcher.useMemo( create, deps );
}

export function useImperativeHandle<T>( ref: Ref<T>, create: () => T, deps: DependencyList ): void {
    const dispatcher = resolveDispatcher();
    return dispatcher.useImperativeHandle( ref, create, deps );
}

export function useDebugValue<T>(value: T, format?: (value: T) => any): void {
    if ( __DEV__ ) {
        const dispatcher = resolveDispatcher();
        return dispatcher.useDebugValue( value, format );
    }
}

export function useTransition(): [ boolean, ( callback: () => void, options?: StartTransitionOptions ) => void ] {
    const dispatcher = resolveDispatcher();
    return dispatcher.useTransition();
}

export function useDeferredValue<T>( value: T, initialValue?: T ): T {
    const dispatcher = resolveDispatcher();
    // @ts-ignore - types mismatch
    return dispatcher.useDeferredValue( value, initialValue );
}

export function useId(): string {
    const dispatcher = resolveDispatcher();
    return dispatcher.useId();
}

export function useSyncExternalStore<T>( subscribe: ( arg0: () => void ) => () => void, getSnapshot: () => T, getServerSnapshot?: () => T ): T {
    const dispatcher = resolveDispatcher();
    return dispatcher.useSyncExternalStore( subscribe, getSnapshot, getServerSnapshot );
}

export function useCacheRefresh<T>( fetch: ( () => T ) | T, cachedValue?: T ): void {
    const dispatcher = resolveDispatcher();
    // $FlowFixMe[not-a-function] This is unstable, thus optional
    return  dispatcher.useCacheRefresh?.( fetch, cachedValue );
}

export function use<T>( usable: Usable<T> ): T {
    const dispatcher = resolveDispatcher();
    return dispatcher.use( usable );
}

export function useMemoCache( size: number ): unknown[] | undefined {
    const dispatcher = resolveDispatcher();
    // $FlowFixMe[not-a-function] This is unstable, thus optional
    return dispatcher.useMemoCache?.( size );
}

export function useEffectEvent<T extends Function>( callback: T ): T {
    const dispatcher = resolveDispatcher();
    // $FlowFixMe[not-a-function] This is unstable, thus optional
    return dispatcher.useEffectEvent?.( callback ) as T;
}

export function useOptimistic<S, A>( passthrough: S, reducer?: ( state: S, action: A ) => S ): [ S, ((action: A) => void) ] | undefined {
    const dispatcher = resolveDispatcher();
    // $FlowFixMe[not-a-function] This is unstable, thus optional
    return dispatcher.useOptimistic?.( passthrough, reducer );
}
