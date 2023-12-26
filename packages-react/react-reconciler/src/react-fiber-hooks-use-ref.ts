import { enableUseRefAccessWarning } from "@zenflux/react-shared/src/react-feature-flags";

import { ReactFiberHooksCurrent } from "@zenflux/react-reconciler/src/react-fiber-hooks-shared";
import reactGetComponentNameFromFiber from "@zenflux/react-reconciler/src/react-get-component-name-from-fiber";

import {
    getCallerStackFrame,
    mountWorkInProgressHook,
    updateWorkInProgressHook
} from "@zenflux/react-reconciler/src/react-fiber-hooks-infra";

import type { MutableRefObject, RefObject } from "@zenflux/react-reconciler/src/react-fiber-hooks-types";

export function mountRef<T>( initialValue: T ): MutableRefObject<T>;
export function mountRef<T>( initialValue: T | null ): RefObject<T>;
export function mountRef<T = undefined>(): MutableRefObject<T | undefined>;
export function mountRef<T>( initialValue?: T ): {
    current: T | undefined;
} {
    const hook = mountWorkInProgressHook();

    if ( enableUseRefAccessWarning ) {
        if ( __DEV__ ) {
            // Support lazy initialization pattern shown in docs.
            // We need to store the caller stack frame so that we don't warn on subsequent renders.
            let hasBeenInitialized = initialValue != null;
            let lazyInitGetterStack: string | null = null;
            let didCheckForLazyInit = false;
            // Only warn once per component+hook.
            let didWarnAboutRead = false;
            let didWarnAboutWrite = false;
            let current = initialValue;
            const ref = {
                get current() {
                    if ( ! hasBeenInitialized ) {
                        didCheckForLazyInit = true;
                        lazyInitGetterStack = getCallerStackFrame();
                    } else if ( ReactFiberHooksCurrent.renderingFiber !== null && ! didWarnAboutRead ) {
                        if ( lazyInitGetterStack === null || lazyInitGetterStack !== getCallerStackFrame() ) {
                            didWarnAboutRead = true;
                            console.warn( "%s: Unsafe read of a mutable value during render.\n\n" + "Reading from a ref during render is only safe if:\n" + "1. The ref value has not been updated, or\n" + "2. The ref holds a lazily-initialized value that is only set once.\n", reactGetComponentNameFromFiber( ReactFiberHooksCurrent.renderingFiber ) || "Unknown" );
                        }
                    }

                    return current;
                },

                set current( value: any ) {
                    if ( ReactFiberHooksCurrent.renderingFiber !== null && ! didWarnAboutWrite ) {
                        if ( hasBeenInitialized || ! didCheckForLazyInit ) {
                            didWarnAboutWrite = true;
                            console.warn( "%s: Unsafe write of a mutable value during render.\n\n" + "Writing to a ref during render is only safe if the ref holds " + "a lazily-initialized value that is only set once.\n", reactGetComponentNameFromFiber( ReactFiberHooksCurrent.renderingFiber ) || "Unknown" );
                        }
                    }

                    hasBeenInitialized = true;
                    current = value;
                }

            };
            Object.seal( ref );
            hook.memoizedState = ref;
            return ref;
        } else {
            const ref = {
                current: initialValue
            };
            hook.memoizedState = ref;
            return ref;
        }
    } else {
        const ref = {
            current: initialValue
        };
        hook.memoizedState = ref;
        return ref;
    }
}

export function updateRef<T>( initialValue: T ): MutableRefObject<T>;
export function updateRef<T>( initialValue: T | null ): RefObject<T>;
export function updateRef<T = undefined>(): MutableRefObject<T | undefined>;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function updateRef<T>( initialValue?: T ): {
    current: T;
} {
    const hook = updateWorkInProgressHook();
    return hook.memoizedState;
}
