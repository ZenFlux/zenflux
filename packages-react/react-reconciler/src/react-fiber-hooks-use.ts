import { REACT_CONTEXT_TYPE, REACT_SERVER_CONTEXT_TYPE } from "@zenflux/react-shared/src/react-symbols";

import ReactSharedInternals from "@zenflux/react-shared/src/react-shared-internals";

import { readContext } from "@zenflux/react-reconciler/src/react-fiber-new-context";
import {
    ReactFiberHooksCurrent, ReactFiberHooksDispatcher,
    ReactFiberHooksDispatcherInDEV
} from "@zenflux/react-reconciler/src/react-fiber-hooks-shared";
import { createThenableState, trackUsedThenable } from "@zenflux/react-reconciler/src/react-fiber-thenable";

import type { ReactContext, Thenable, Usable } from "@zenflux/react-shared/src/react-types";

const {
    ReactCurrentDispatcher,
} = ReactSharedInternals;

export function use<T>( usable: Usable<T> ): T {
    if ( usable !== null && typeof usable === "object" ) {
        if ( typeof ( usable as Thenable<T> ).then === "function" ) {
            // This is a thenable.
            const thenable: Thenable<T> = usable as Thenable<T>;
            return useThenable( thenable );
        } else if ( ( usable as ReactContext<T> ).$$typeof === REACT_CONTEXT_TYPE || ( usable as ReactContext<T> ).$$typeof === REACT_SERVER_CONTEXT_TYPE ) {
            const context: ReactContext<T> = usable as ReactContext<T>;
            return readContext( context );
        }
    }

    // not-used: eslint-disable-next-line react-internal/safe-string-coercion
    throw new Error( "An unsupported type was passed to use(): " + String( usable ) );
}

export function useThenable<T>( thenable: Thenable<T> ): T {
    // Track the position of the thenable within this fiber.
    const index = ReactFiberHooksCurrent.thenableIndexCounter;
    ReactFiberHooksCurrent.thenableIndexCounter += 1;

    if ( ReactFiberHooksCurrent.thenableState === null ) {
        ReactFiberHooksCurrent.thenableState = createThenableState();
    }

    const result = trackUsedThenable( ReactFiberHooksCurrent.thenableState, thenable, index );

    if ( ReactFiberHooksCurrent.renderingFiber.alternate === null && ( ReactFiberHooksCurrent.workInProgressHook === null ? ReactFiberHooksCurrent.renderingFiber.memoizedState === null : ReactFiberHooksCurrent.workInProgressHook.next === null ) ) {
        // Initial render, and either this is the first time the component is
        // called, or there were no Hooks called after this use() the previous
        // time (perhaps because it threw). Subsequent Hook calls should use the
        // mount dispatcher.
        if ( __DEV__ ) {
            ReactCurrentDispatcher.current = ReactFiberHooksDispatcherInDEV.onMount;
        } else {
            ReactCurrentDispatcher.current = ReactFiberHooksDispatcher.onMount;
        }
    }

    return result;
}
