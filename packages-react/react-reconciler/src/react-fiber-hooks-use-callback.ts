import { areHookInputsEqual, mountWorkInProgressHook, updateWorkInProgressHook } from "@zenflux/react-reconciler/src/react-fiber-hooks-infra";

import type { DependencyList } from "@zenflux/react-reconciler/src/react-fiber-hooks-types";

export function mountCallback<T extends Function>( callback: T, deps: DependencyList ): T {
    const hook = mountWorkInProgressHook();
    const nextDeps = deps === undefined ? null : deps;
    hook.memoizedState = [ callback, nextDeps ];
    return callback;
}

export function updateCallback<T extends Function>( callback: T, deps: DependencyList ): T {
    const hook = updateWorkInProgressHook();
    const nextDeps = deps === undefined ? null : deps;
    const prevState = hook.memoizedState;

    if ( nextDeps !== null ) {
        const prevDeps: Array<unknown> | null = prevState[ 1 ];

        if ( areHookInputsEqual( nextDeps, prevDeps ) ) {
            return prevState[ 0 ];
        }
    }

    hook.memoizedState = [ callback, nextDeps ];
    return callback;
}
