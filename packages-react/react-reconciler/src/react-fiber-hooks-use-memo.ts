import {
    areHookInputsEqual,
    mountWorkInProgressHook,
    updateWorkInProgressHook
} from "@zenflux/react-reconciler/src/react-fiber-hooks-infra";

import { ReactFiberHooksInfra } from "@zenflux/react-reconciler/src/react-fiber-hooks-shared";

import type { DependencyList } from "@zenflux/react-reconciler/src/react-fiber-hooks-types";

export function mountMemo<T>( nextCreate: () => T, deps: DependencyList | undefined ): T {
    const hook = mountWorkInProgressHook();
    const nextDeps = deps === undefined ? null : deps;

    if ( ReactFiberHooksInfra.shouldDoubleInvokeUserFnsInHooksDEV ) {
        nextCreate();
    }

    const nextValue = nextCreate();
    hook.memoizedState = [ nextValue, nextDeps ];
    return nextValue;
};

export function updateMemo<T>( nextCreate: () => T, deps: DependencyList | undefined ): T {
    const hook = updateWorkInProgressHook();
    const nextDeps = deps === undefined ? null : deps;
    const prevState = hook.memoizedState;

    // Assume these are defined. If they're not, areHookInputsEqual will warn.
    if ( nextDeps !== null ) {
        const prevDeps: Array<unknown> | null = prevState[ 1 ];

        if ( areHookInputsEqual( nextDeps, prevDeps ) ) {
            return prevState[ 0 ];
        }
    }

    if ( ReactFiberHooksInfra.shouldDoubleInvokeUserFnsInHooksDEV ) {
        nextCreate();
    }

    const nextValue = nextCreate();
    hook.memoizedState = [ nextValue, nextDeps ];
    return nextValue;
}
