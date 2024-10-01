import {
    debugRenderPhaseSideEffectsForStrictMode,
    enableAsyncActions,
    enableCache,
    enableFormActions,
    enableLazyContextPropagation,
    enableUseEffectEventHook,
    enableUseMemoCacheHook
} from "@zenflux/react-shared/src/react-feature-flags";
import ReactSharedInternals from "@zenflux/react-shared/src/react-shared-internals";

import { includesBlockingLane, NoLanes } from "@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants";

import { WorkTag } from "@zenflux/react-shared/src/react-internal-constants/work-tags";

import { FiberFlags } from "@zenflux/react-shared/src/react-internal-constants/fiber-flags";

import { TypeOfMode } from "@zenflux/react-shared/src/react-internal-constants/type-of-mode";

import { setIsStrictModeForDevtools } from "@zenflux/react-reconciler/src/react-fiber-dev-tools-hook";

import {
    ReactFiberHooksCurrent,
    ReactFiberHooksDispatcher,
    ReactFiberHooksDispatcherInDEV,
    ReactFiberHooksFlags,
    ReactFiberHooksInfra,
    ReactFiberHooksInvalidNestedHooksDispatcherInDEV
} from "@zenflux/react-reconciler/src/react-fiber-hooks-shared";

import { throwInvalidHookError } from "@zenflux/react-reconciler/src/react-fiber-hooks-throw";
import { use, useThenable } from "@zenflux/react-reconciler/src/react-fiber-hooks-use";
import { mountCallback, updateCallback } from "@zenflux/react-reconciler/src/react-fiber-hooks-use-callback";
import { mountDebugValue, updateDebugValue } from "@zenflux/react-reconciler/src/react-fiber-hooks-use-debug-value";
import {
    mountDeferredValue,
    rerenderDeferredValue,
    updateDeferredValue
} from "@zenflux/react-reconciler/src/react-fiber-hooks-use-deferred-value";
import { mountEffect, updateEffect } from "@zenflux/react-reconciler/src/react-fiber-hooks-use-effect";
import { mountEvent, updateEvent } from "@zenflux/react-reconciler/src/react-fiber-hooks-use-effect-event";
import {
    mountFormState,
    rerenderFormState,
    updateFormState
} from "@zenflux/react-reconciler/src/react-fiber-hooks-use-form-state";
import { useHostTransitionStatus } from "@zenflux/react-reconciler/src/react-fiber-hooks-use-host-transaction-status";
import { mountId, updateId } from "@zenflux/react-reconciler/src/react-fiber-hooks-use-id";
import {
    mountImperativeHandle,
    updateImperativeHandle
} from "@zenflux/react-reconciler/src/react-fiber-hooks-use-imperative-handle";
import {
    mountInsertionEffect,
    updateInsertionEffect
} from "@zenflux/react-reconciler/src/react-fiber-hooks-use-inseration-effect";
import {
    mountLayoutEffect,
    updateLayoutEffect
} from "@zenflux/react-reconciler/src/react-fiber-hooks-use-layout-effect";
import { mountMemo, updateMemo } from "@zenflux/react-reconciler/src/react-fiber-hooks-use-memo";
import { useMemoCache } from "@zenflux/react-reconciler/src/react-fiber-hooks-use-memo-cache";
import {
    mountOptimistic,
    rerenderOptimistic,
    updateOptimistic
} from "@zenflux/react-reconciler/src/react-fiber-hooks-use-optimistic";
import {
    mountReducer,
    rerenderReducer,
    updateReducer
} from "@zenflux/react-reconciler/src/react-fiber-hooks-use-reducer";
import { mountRef, updateRef } from "@zenflux/react-reconciler/src/react-fiber-hooks-use-ref";
import { mountRefresh, updateRefresh } from "@zenflux/react-reconciler/src/react-fiber-hooks-use-refresh";
import {
    basicStateReducer,
    mountState,
    rerenderState,
    updateState
} from "@zenflux/react-reconciler/src/react-fiber-hooks-use-state";
import {
    mountSyncExternalStore,
    updateSyncExternalStore
} from "@zenflux/react-reconciler/src/react-fiber-hooks-use-sync-external-store";
import {
    mountTransition,
    rerenderTransition,
    startTransition,
    updateTransition
} from "@zenflux/react-reconciler/src/react-fiber-hooks-use-transaction";
import { removeLanes, } from "@zenflux/react-reconciler/src/react-fiber-lane";

import { checkIfContextChanged, readContext } from "@zenflux/react-reconciler/src/react-fiber-new-context";
import { checkIfUseWrappedInTryCatch } from "@zenflux/react-reconciler/src/react-fiber-thenable";
import {
    getWorkInProgressRoot,
    getWorkInProgressRootRenderLanes
} from "@zenflux/react-reconciler/src/react-fiber-work-in-progress";
import {
    checkIfWorkInProgressReceivedUpdate,
    markWorkInProgressReceivedUpdate
} from "@zenflux/react-reconciler/src/react-fiber-work-in-progress-receive-update";
import reactGetComponentNameFromFiber from "@zenflux/react-reconciler/src/react-get-component-name-from-fiber";

import type { TransitionStatus } from "@zenflux/react-shared/src/react-internal-types/transition";

import type { BasicStateAction, Hook } from "@zenflux/react-reconciler/src/react-fiber-hooks-types";
import type { Dispatcher, Fiber, HookUpdateQueue, Lanes } from "@zenflux/react-shared/src/react-internal-types";
import type { ReactContext, Thenable, Usable } from "@zenflux/react-shared/src/react-types";

import type { HookType } from "@zenflux/react-shared/src/react-internal-types/hook";

const NoPendingHostTransition = globalThis.__RECONCILER__CONFIG__.NotPendingTransition;

const RE_RENDER_LIMIT = 25;

const {
    ReactCurrentDispatcher,
} = ReactSharedInternals;

if ( __DEV__ ) {
    ReactFiberHooksFlags.didWarnAboutMismatchedHooksForComponent = new Set<string | null>();
    ReactFiberHooksFlags.didWarnAboutUseWrappedInTryCatch = new Set<string | null>();
    ReactFiberHooksFlags.didWarnAboutAsyncClientComponent = new Set<string | null>();
}

function mountHookTypesDev(): void {
    if ( __DEV__ ) {
        const hookName = ( ( ReactFiberHooksCurrent.hookNameInDev as any ) as HookType );

        if ( ReactFiberHooksCurrent.hookTypesDev === null ) {
            ReactFiberHooksCurrent.hookTypesDev = [ hookName ];
        } else {
            ReactFiberHooksCurrent.hookTypesDev.push( hookName );
        }
    }
}

function updateHookTypesDev(): void {
    if ( __DEV__ ) {
        const hookName = ( ( ReactFiberHooksCurrent.hookNameInDev as any ) as HookType );

        if ( ReactFiberHooksCurrent.hookTypesDev !== null ) {
            ReactFiberHooksCurrent.hookTypesUpdateIndexDev++;

            if ( ReactFiberHooksCurrent.hookTypesDev[ ReactFiberHooksCurrent.hookTypesUpdateIndexDev ] !== hookName ) {
                warnOnHookMismatchInDev( hookName );
            }
        }
    }
}

function checkDepsAreArrayDev( deps: unknown ): void {
    if ( __DEV__ ) {
        if ( deps !== undefined && deps !== null && ! Array.isArray( deps ) ) {
            // Verify deps, but only on mount to avoid extra checks.
            // It's unlikely their type would change as usually you define them inline.
            console.error( "%s received a final argument that is not an array (instead, received `%s`). When " + "specified, the final argument must be an array.", ReactFiberHooksCurrent.hookNameInDev, typeof deps );
        }
    }
}

function warnOnHookMismatchInDev( currentHookName: HookType ): void {
    if ( __DEV__ ) {
        const componentName = reactGetComponentNameFromFiber( ReactFiberHooksCurrent.renderingFiber );

        if ( ! ReactFiberHooksFlags.didWarnAboutMismatchedHooksForComponent.has( componentName ) ) {
            ReactFiberHooksFlags.didWarnAboutMismatchedHooksForComponent.add( componentName );

            if ( ReactFiberHooksCurrent.hookTypesDev !== null ) {
                let table = "";
                const secondColumnStart = 30;

                for ( let i = 0 ; i <= ( ( ReactFiberHooksCurrent.hookTypesUpdateIndexDev as any ) as number ) ; i++ ) {
                    const oldHookName = ReactFiberHooksCurrent.hookTypesDev[ i ];
                    const newHookName = i === ( ( ReactFiberHooksCurrent.hookTypesUpdateIndexDev as any ) as number ) ? currentHookName : oldHookName;
                    let row = `${ i + 1 }. ${ oldHookName }`;

                    // Extra space so second column lines up
                    // lol @ IE not supporting String#repeat
                    while ( row.length < secondColumnStart ) {
                        row += " ";
                    }

                    row += newHookName + "\n";
                    table += row;
                }

                console.error( "React has detected a change in the order of Hooks called by %s. " + "This will lead to bugs and errors if not fixed. " + "For more information, read the Rules of Hooks: https://reactjs.org/link/rules-of-hooks\n\n" + "   Previous render            Next render\n" + "   ------------------------------------------------------\n" + "%s" + "   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n", componentName, table );
            }
        }
    }
}

function warnIfAsyncClientComponent( Component: Function, componentDoesIncludeHooks: boolean ) {
    if ( __DEV__ ) {
        // This dev-only check only works for detecting native async functions,
        // not transpiled ones. There's also a prod check that we use to prevent
        // async client components from crashing the app; the prod one works even
        // for transpiled async functions. Neither mechanism is completely
        // bulletproof but together they cover the most common cases.
        const isAsyncFunction = // $FlowIgnore[method-unbinding]
            Object.prototype.toString.call( Component ) === "[object AsyncFunction]";

        if ( isAsyncFunction ) {
            // Encountered an async Client Component. This is not yet supported,
            // except in certain constrained cases, like during a route navigation.
            const componentName = reactGetComponentNameFromFiber( ReactFiberHooksCurrent.renderingFiber );

            if ( ! ReactFiberHooksFlags.didWarnAboutAsyncClientComponent.has( componentName ) ) {
                ReactFiberHooksFlags.didWarnAboutAsyncClientComponent.add( componentName );
                // Check if this is a sync update. We use the "root" render lanes here
                // because the "subtree" render lanes may include additional entangled
                // lanes related to revealing previously hidden content.
                const root = getWorkInProgressRoot();
                const rootRenderLanes = getWorkInProgressRootRenderLanes();

                if ( root !== null && includesBlockingLane( root, rootRenderLanes ) ) {
                    console.error( "async/await is not yet supported in Client Components, only " + "Server Components. This error is often caused by accidentally " + "adding `'use client'` to a module that was originally written " + "for the server." );
                } else {
                    // This is a concurrent (Transition, Retry, etc) render. We don't
                    // warn in these cases.
                    //
                    // However, Async Components are forbidden to include hooks, even
                    // during a transition, so let's check for that here.
                    //
                    // TODO: Add a corresponding warning to Server Components runtime.
                    if ( componentDoesIncludeHooks ) {
                        console.error( "Hooks are not supported inside an async component. This " + "error is often caused by accidentally adding `'use client'` " + "to a module that was originally written for the server." );
                    }
                }
            }
        }
    }
}

function renderWithHooksAgain<Props, SecondArg>( workInProgress: Fiber, Component: ( p: Props, arg: SecondArg ) => any, props: Props, secondArg: SecondArg ): any {
    // This is used to perform another render pass. It's used when setState is
    // called during render, and for double invoking components in Strict Mode
    // during development.
    //
    // The state from the previous pass is reused whenever possible. So, state
    // updates that were already processed are not processed again, and memoized
    // functions (`useMemo`) are not invoked again.
    //
    // Keep rendering in a loop for as long as render phase updates continue to
    // be scheduled. Use a counter to prevent infinite loops.
    ReactFiberHooksCurrent.renderingFiber = workInProgress;
    let numberOfReRenders: number = 0;
    let children;

    do {
        if ( ReactFiberHooksFlags.didScheduleRenderPhaseUpdateDuringThisPass ) {
            // It's possible that a use() value depended on a state that was updated in
            // this rerender, so we need to watch for different thenables this time.
            ReactFiberHooksCurrent.thenableState = null;
        }

        ReactFiberHooksCurrent.thenableIndexCounter = 0;
        ReactFiberHooksFlags.didScheduleRenderPhaseUpdateDuringThisPass = false;

        if ( numberOfReRenders >= RE_RENDER_LIMIT ) {
            throw new Error( "Too many re-renders. React limits the number of renders to prevent " + "an infinite loop." );
        }

        numberOfReRenders += 1;

        if ( __DEV__ ) {
            // Even when hot reloading, allow dependencies to stabilize
            // after first render to prevent infinite render phase updates.
            ReactFiberHooksInfra.ignorePreviousDependencies = false;
        }

        // Start over from the beginning of the list
        ReactFiberHooksCurrent.hook = null;
        ReactFiberHooksCurrent.workInProgressHook = null;
        workInProgress.updateQueue = null;

        if ( __DEV__ ) {
            // Also validate hook order for cascading updates.
            ReactFiberHooksCurrent.hookTypesUpdateIndexDev = -1;
        }

        ReactCurrentDispatcher.current = __DEV__ ? ReactFiberHooksDispatcherInDEV.onRerender : ReactFiberHooksDispatcher.onRerender;
        children = Component( props, secondArg );
    } while ( ReactFiberHooksFlags.didScheduleRenderPhaseUpdateDuringThisPass );

    return children;
}

function finishRenderingHooks<Props, SecondArg>( current: Fiber | null, workInProgress: Fiber, Component: ( p: Props, arg: SecondArg ) => any ): void {
    if ( __DEV__ ) {
        workInProgress._debugHookTypes = ReactFiberHooksCurrent.hookTypesDev;
        const componentDoesIncludeHooks = ReactFiberHooksCurrent.workInProgressHook !== null || ReactFiberHooksCurrent.thenableIndexCounter !== 0;
        warnIfAsyncClientComponent( Component, componentDoesIncludeHooks );
    }

    // We can assume the previous dispatcher is always this one, since we set it
    // at the beginning of the render phase and there's no re-entrance.
    ReactCurrentDispatcher.current = ReactFiberHooksDispatcher.contextOnly;
    // This check uses ReactFiberHooksCurrent.hook so that it works the same in DEV and prod bundles.
    // ReactFiberHooksCurrent.hookTypesDev could catch more cases (e.g. context) but only in DEV bundles.
    const didRenderTooFewHooks = ReactFiberHooksCurrent.hook !== null && ReactFiberHooksCurrent.hook.next !== null;
    ReactFiberHooksCurrent.renderLanes = NoLanes;
    ReactFiberHooksCurrent.renderingFiber = ( null as any );
    ReactFiberHooksCurrent.hook = null;
    ReactFiberHooksCurrent.workInProgressHook = null;

    if ( __DEV__ ) {
        ReactFiberHooksCurrent.hookNameInDev = null;
        ReactFiberHooksCurrent.hookTypesDev = null;
        ReactFiberHooksCurrent.hookTypesUpdateIndexDev = -1;

        // Confirm that a static flag was not added or removed since the last
        // render. If this fires, it suggests that we incorrectly reset the static
        // flags in some other part of the codebase. This has happened before, for
        // example, in the SuspenseList implementation.
        if ( current !== null && ( current.flags & FiberFlags.StaticMask ) !== ( workInProgress.flags & FiberFlags.StaticMask ) && // Disable this warning in legacy mode, because legacy Suspense is weird
            // and creates false positives. To make this work in legacy mode, we'd
            // need to mark fibers that commit in an incomplete state, somehow. For
            // now I'll disable the warning that most of the bugs that would trigger
            // it are either exclusive to concurrent mode or exist in both.
            ( current.mode & TypeOfMode.ConcurrentMode ) !== TypeOfMode.NoMode ) {
            console.error( "Internal React error: Expected static flag was missing. Please " + "notify the React team." );
        }
    }

    ReactFiberHooksFlags.didScheduleRenderPhaseUpdate = false;
    // This is reset by checkDidRenderIdHook
    // ReactFiberHooksCurrent.localIdCounter = 0;
    ReactFiberHooksCurrent.thenableIndexCounter = 0;
    ReactFiberHooksCurrent.thenableState = null;

    if ( didRenderTooFewHooks ) {
        throw new Error( "Rendered fewer hooks than expected. This may be caused by an accidental " + "early return statement." );
    }

    if ( enableLazyContextPropagation ) {
        if ( current !== null ) {
            if ( ! checkIfWorkInProgressReceivedUpdate() ) {
                // If there were no changes to props or state, we need to check if there
                // was a context change. We didn't already do this because there's no
                // 1:1 correspondence between dependencies and hooks. Although, because
                // there almost always is in the common case (`readContext` is an
                // internal API), we could compare in there. OTOH, we only hit this case
                // if everything else bails out, so on the whole it might be better to
                // keep the comparison out of the common path.
                const currentDependencies = current.dependencies;

                if ( currentDependencies !== null && checkIfContextChanged( currentDependencies ) ) {
                    markWorkInProgressReceivedUpdate();
                }
            }
        }
    }

    if ( __DEV__ ) {
        if ( checkIfUseWrappedInTryCatch() ) {
            const componentName = reactGetComponentNameFromFiber( workInProgress ) || "Unknown";

            if ( ! ReactFiberHooksFlags.didWarnAboutUseWrappedInTryCatch.has( componentName ) && // This warning also fires if you suspend with `use` inside an
                // async component. Since we warn for that above, we'll silence this
                // second warning by checking here.
                ! ReactFiberHooksFlags.didWarnAboutAsyncClientComponent.has( componentName ) ) {
                ReactFiberHooksFlags.didWarnAboutUseWrappedInTryCatch.add( componentName );
                console.error( "`use` was called from inside a try/catch block. This is not allowed " + "and can lead to unexpected behavior. To handle errors triggered " + "by `use`, wrap your component in a error boundary." );
            }
        }
    }
}

// ---
// Context only
// ---
ReactFiberHooksDispatcher.contextOnly = {
    readContext,
    use,
    useCallback: throwInvalidHookError,
    useContext: throwInvalidHookError,
    useEffect: throwInvalidHookError,
    useImperativeHandle: throwInvalidHookError,
    useInsertionEffect: throwInvalidHookError,
    useLayoutEffect: throwInvalidHookError,
    useMemo: throwInvalidHookError,
    useReducer: throwInvalidHookError,
    useRef: throwInvalidHookError,
    useState: throwInvalidHookError,
    useDebugValue: throwInvalidHookError,
    useDeferredValue: throwInvalidHookError,
    useTransition: throwInvalidHookError,
    useSyncExternalStore: throwInvalidHookError,
    useId: throwInvalidHookError
};

if ( enableCache ) {
    ReactFiberHooksDispatcher.contextOnly.useCacheRefresh = throwInvalidHookError;
}

if ( enableUseMemoCacheHook ) {
    ReactFiberHooksDispatcher.contextOnly.useMemoCache = throwInvalidHookError;
}

if ( enableUseEffectEventHook ) {
    ReactFiberHooksDispatcher.contextOnly.useEffectEvent = throwInvalidHookError;
}

if ( enableFormActions && enableAsyncActions ) {
    ReactFiberHooksDispatcher.contextOnly.useHostTransitionStatus = throwInvalidHookError;
    ReactFiberHooksDispatcher.contextOnly.useFormState = throwInvalidHookError;
}

if ( enableAsyncActions ) {
    ReactFiberHooksDispatcher.contextOnly.useOptimistic = throwInvalidHookError;
}

// ---
// On mount
// ---
ReactFiberHooksDispatcher.onMount = {
    readContext,
    use,
    useCallback: mountCallback,
    useContext: readContext,
    useEffect: mountEffect,
    useImperativeHandle: mountImperativeHandle,
    useLayoutEffect: mountLayoutEffect,
    useInsertionEffect: mountInsertionEffect,
    useMemo: mountMemo,
    useReducer: mountReducer,
    useRef: mountRef,
    useState: mountState,
    useDebugValue: mountDebugValue,
    useDeferredValue: mountDeferredValue,
    useTransition: mountTransition,
    useSyncExternalStore: mountSyncExternalStore,
    useId: mountId
};

if ( enableCache ) {
    ReactFiberHooksDispatcher.onMount.useCacheRefresh = mountRefresh;
}

if ( enableUseMemoCacheHook ) {
    ReactFiberHooksDispatcher.onMount.useMemoCache = useMemoCache;
}

if ( enableUseEffectEventHook ) {
    ReactFiberHooksDispatcher.onMount.useEffectEvent = mountEvent;
}

if ( enableFormActions && enableAsyncActions ) {
    ReactFiberHooksDispatcher.onMount.useHostTransitionStatus = useHostTransitionStatus;
    ReactFiberHooksDispatcher.onMount.useFormState = mountFormState;
}

if ( enableAsyncActions ) {
    ReactFiberHooksDispatcher.onMount.useOptimistic = mountOptimistic;
}

// ---
// On update
// ---
ReactFiberHooksDispatcher.onUpdate = {
    readContext,
    use,
    useCallback: updateCallback,
    useContext: readContext,
    useEffect: updateEffect,
    useImperativeHandle: updateImperativeHandle,
    useInsertionEffect: updateInsertionEffect,
    useLayoutEffect: updateLayoutEffect,
    useMemo: updateMemo,
    useReducer: updateReducer,
    useRef: updateRef,
    useState: updateState,
    useDebugValue: updateDebugValue,
    useDeferredValue: updateDeferredValue,
    useTransition: updateTransition,
    useSyncExternalStore: updateSyncExternalStore,
    useId: updateId
};

if ( enableCache ) {
    ReactFiberHooksDispatcher.onUpdate.useCacheRefresh = updateRefresh;
}

if ( enableUseMemoCacheHook ) {
    ReactFiberHooksDispatcher.onUpdate.useMemoCache = useMemoCache;
}

if ( enableUseEffectEventHook ) {
    ReactFiberHooksDispatcher.onUpdate.useEffectEvent = updateEvent;
}

if ( enableFormActions && enableAsyncActions ) {
    ReactFiberHooksDispatcher.onUpdate.useHostTransitionStatus = useHostTransitionStatus;
    ReactFiberHooksDispatcher.onUpdate.useFormState = updateFormState;
}

if ( enableAsyncActions ) {
    ReactFiberHooksDispatcher.onUpdate.useOptimistic = updateOptimistic;
}

// ---
// On render
// ---
ReactFiberHooksDispatcher.onRerender = {
    readContext,
    use,
    useCallback: updateCallback,
    useContext: readContext,
    useEffect: updateEffect,
    useImperativeHandle: updateImperativeHandle,
    useInsertionEffect: updateInsertionEffect,
    useLayoutEffect: updateLayoutEffect,
    useMemo: updateMemo,
    useReducer: rerenderReducer,
    useRef: updateRef,
    useState: rerenderState,
    useDebugValue: updateDebugValue,
    useDeferredValue: rerenderDeferredValue,
    useTransition: rerenderTransition,
    useSyncExternalStore: updateSyncExternalStore,
    useId: updateId
};

if ( enableCache ) {
    ReactFiberHooksDispatcher.onRerender.useCacheRefresh = updateRefresh;
}

if ( enableUseMemoCacheHook ) {
    ReactFiberHooksDispatcher.onRerender.useMemoCache = useMemoCache;
}

if ( enableUseEffectEventHook ) {
    ReactFiberHooksDispatcher.onRerender.useEffectEvent = updateEvent;
}

if ( enableFormActions && enableAsyncActions ) {
    ReactFiberHooksDispatcher.onRerender.useHostTransitionStatus = useHostTransitionStatus;
    ReactFiberHooksDispatcher.onRerender.useFormState = rerenderFormState;
}

if ( enableAsyncActions ) {
    ReactFiberHooksDispatcher.onRerender.useOptimistic = rerenderOptimistic;
}

if ( __DEV__ ) {
    const warnInvalidContextAccess = () => {
        console.error( "Context can only be read while React is rendering. " + "In classes, you can read it in the render method or getDerivedStateFromProps. " + "In function components, you can read it directly in the function body, but not " + "inside Hooks like useReducer() or useMemo()." );
    };

    const warnInvalidHookAccess = () => {
        console.error( "Do not call Hooks inside useEffect(...), useMemo(...), or other built-in Hooks. " + "You can only call Hooks at the top level of your React function. " + "For more information, see " + "https://reactjs.org/link/rules-of-hooks" );
    };

    ReactFiberHooksDispatcherInDEV.onMount = {
        readContext<T>( context: ReactContext<T> ): T {
            return readContext( context );
        },

        use,

        useCallback( callback, deps ) {
            ReactFiberHooksCurrent.hookNameInDev = "useCallback";
            mountHookTypesDev();
            checkDepsAreArrayDev( deps );
            return mountCallback( callback, deps );
        },

        useContext( context ) {
            ReactFiberHooksCurrent.hookNameInDev = "useContext";
            mountHookTypesDev();
            return readContext( context );
        },

        useEffect( create, deps ) {
            ReactFiberHooksCurrent.hookNameInDev = "useEffect";
            mountHookTypesDev();
            checkDepsAreArrayDev( deps );
            return mountEffect( create, deps );
        },

        useImperativeHandle( ref, create, deps ) {
            ReactFiberHooksCurrent.hookNameInDev = "useImperativeHandle";
            mountHookTypesDev();
            checkDepsAreArrayDev( deps );
            return mountImperativeHandle( ref, create, deps );
        },

        useInsertionEffect( create, deps ) {
            ReactFiberHooksCurrent.hookNameInDev = "useInsertionEffect";
            mountHookTypesDev();
            checkDepsAreArrayDev( deps );
            return mountInsertionEffect( create, deps );
        },

        useLayoutEffect( create, deps ) {
            ReactFiberHooksCurrent.hookNameInDev = "useLayoutEffect";
            mountHookTypesDev();
            checkDepsAreArrayDev( deps );
            return mountLayoutEffect( create, deps );
        },

        useMemo( create, deps ) {
            ReactFiberHooksCurrent.hookNameInDev = "useMemo";
            mountHookTypesDev();
            checkDepsAreArrayDev( deps );
            const prevDispatcher = ReactCurrentDispatcher.current;
            ReactCurrentDispatcher.current = ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onMount;

            try {
                return mountMemo( create, deps );
            } finally {
                ReactCurrentDispatcher.current = prevDispatcher;
            }
        },

        useReducer( reducer: any, initialArg: any, init: any ) {
            ReactFiberHooksCurrent.hookNameInDev = "useReducer";
            mountHookTypesDev();
            const prevDispatcher = ReactCurrentDispatcher.current;
            ReactCurrentDispatcher.current = ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onMount;

            try {
                return mountReducer( reducer, initialArg, init );
            } finally {
                ReactCurrentDispatcher.current = prevDispatcher;
            }
        },

        useRef( initialValue? ) {
            ReactFiberHooksCurrent.hookNameInDev = "useRef";
            mountHookTypesDev();
            return mountRef( initialValue );
        },

        useState( initialState? ) {
            ReactFiberHooksCurrent.hookNameInDev = "useState";
            mountHookTypesDev();
            const prevDispatcher = ReactCurrentDispatcher.current;
            ReactCurrentDispatcher.current = ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onMount;

            try {
                return mountState( initialState );
            } finally {
                ReactCurrentDispatcher.current = prevDispatcher;
            }
        },

        useDebugValue<T>( value: T, formatterFn: ( ( value: T ) => unknown ) | null | undefined ): void {
            ReactFiberHooksCurrent.hookNameInDev = "useDebugValue";
            mountHookTypesDev();
            return mountDebugValue( value, formatterFn );
        },

        useDeferredValue<T>( value: T, initialValue?: T ): T {
            ReactFiberHooksCurrent.hookNameInDev = "useDeferredValue";
            mountHookTypesDev();
            return mountDeferredValue( value, initialValue );
        },

        useTransition(): [ boolean, ( arg0: () => void ) => void ] {
            ReactFiberHooksCurrent.hookNameInDev = "useTransition";
            mountHookTypesDev();
            return mountTransition();
        },

        useSyncExternalStore<T>( subscribe: ( arg0: () => void ) => () => void, getSnapshot: () => T, getServerSnapshot?: () => T ): T {
            ReactFiberHooksCurrent.hookNameInDev = "useSyncExternalStore";
            mountHookTypesDev();
            return mountSyncExternalStore( subscribe, getSnapshot, getServerSnapshot );
        },

        useId(): string {
            ReactFiberHooksCurrent.hookNameInDev = "useId";
            mountHookTypesDev();
            return mountId();
        }

    };

    if ( enableCache ) {
        ReactFiberHooksDispatcherInDEV.onMount.useCacheRefresh = function useCacheRefresh() {
            ReactFiberHooksCurrent.hookNameInDev = "useCacheRefresh";
            mountHookTypesDev();
            return mountRefresh();
        };
    }

    if ( enableUseMemoCacheHook ) {
        ReactFiberHooksDispatcherInDEV.onMount.useMemoCache = useMemoCache;
    }

    if ( enableUseEffectEventHook ) {
        ReactFiberHooksDispatcherInDEV.onMount.useEffectEvent = function useEffectEvent( callback ): any {
            ReactFiberHooksCurrent.hookNameInDev = "useEffectEvent";
            mountHookTypesDev();

            return mountEvent( callback );
        };
    }

    if ( enableFormActions && enableAsyncActions ) {
        ReactFiberHooksDispatcherInDEV.onMount.useHostTransitionStatus = useHostTransitionStatus;

        function useFormState<State, Payload>( action: ( state: State, payload: Payload ) => any, initialState: any, permalink: string | undefined ): any;
        function useFormState<State, Payload>( action: ( state: State | Promise<State>, payload: Payload ) => any, initialState: any, permalink: string | undefined ) {
            ReactFiberHooksCurrent.hookNameInDev = "useFormState";
            mountHookTypesDev();
            return mountFormState( action, initialState, permalink );
        };

        ReactFiberHooksDispatcherInDEV.onMount.useFormState = useFormState;
    }

    if ( enableAsyncActions ) {
        ReactFiberHooksDispatcherInDEV.onMount.useOptimistic = function useOptimistic<S, A>( passthrough: S, reducer: ( ( arg0: S, arg1: A ) => S ) | null | undefined ): [ S, ( arg0: A ) => void ] {
            ReactFiberHooksCurrent.hookNameInDev = "useOptimistic";
            mountHookTypesDev();
            return mountOptimistic( passthrough, reducer );
        };
    }

    ReactFiberHooksDispatcherInDEV.onMountWithHookTypes = {
        readContext<T>( context: ReactContext<T> ): T {
            return readContext( context );
        },

        use,

        useCallback( callback, deps ) {
            ReactFiberHooksCurrent.hookNameInDev = "useCallback";
            updateHookTypesDev();
            return mountCallback( callback, deps );
        },

        useContext( context ) {
            ReactFiberHooksCurrent.hookNameInDev = "useContext";
            updateHookTypesDev();
            return readContext( context );
        },

        useEffect( create, deps ) {
            ReactFiberHooksCurrent.hookNameInDev = "useEffect";
            updateHookTypesDev();
            return mountEffect( create, deps );
        },

        useImperativeHandle( ref, create, deps ) {
            ReactFiberHooksCurrent.hookNameInDev = "useImperativeHandle";
            updateHookTypesDev();
            return mountImperativeHandle( ref, create, deps );
        },

        useInsertionEffect( create, deps ) {
            ReactFiberHooksCurrent.hookNameInDev = "useInsertionEffect";
            updateHookTypesDev();
            return mountInsertionEffect( create, deps );
        },

        useLayoutEffect( create, deps ) {
            ReactFiberHooksCurrent.hookNameInDev = "useLayoutEffect";
            updateHookTypesDev();
            return mountLayoutEffect( create, deps );
        },

        useMemo( create, deps ) {
            ReactFiberHooksCurrent.hookNameInDev = "useMemo";
            updateHookTypesDev();
            const prevDispatcher = ReactCurrentDispatcher.current;
            ReactCurrentDispatcher.current = ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onMount;

            try {
                return mountMemo( create, deps );
            } finally {
                ReactCurrentDispatcher.current = prevDispatcher;
            }
        },

        useReducer( reducer: any, initialArg: any, init: any ) {
            ReactFiberHooksCurrent.hookNameInDev = "useReducer";
            updateHookTypesDev();
            const prevDispatcher = ReactCurrentDispatcher.current;
            ReactCurrentDispatcher.current = ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onMount;

            try {
                return mountReducer( reducer, initialArg, init );
            } finally {
                ReactCurrentDispatcher.current = prevDispatcher;
            }
        },

        useRef( initialValue? ) {
            ReactFiberHooksCurrent.hookNameInDev = "useRef";
            updateHookTypesDev();
            return mountRef( initialValue );
        },

        useState( initialState? ) {
            ReactFiberHooksCurrent.hookNameInDev = "useState";
            updateHookTypesDev();
            const prevDispatcher = ReactCurrentDispatcher.current;
            ReactCurrentDispatcher.current = ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onMount;

            try {
                return mountState( initialState );
            } finally {
                ReactCurrentDispatcher.current = prevDispatcher;
            }
        },

        useDebugValue<T>( value: T, formatterFn: ( ( value: T ) => unknown ) | null | undefined ): void {
            ReactFiberHooksCurrent.hookNameInDev = "useDebugValue";
            updateHookTypesDev();
            return mountDebugValue( value, formatterFn );
        },

        useDeferredValue<T>( value: T, initialValue?: T ): T {
            ReactFiberHooksCurrent.hookNameInDev = "useDeferredValue";
            updateHookTypesDev();
            return mountDeferredValue( value, initialValue );
        },

        useTransition(): [ boolean, ( arg0: () => void ) => void ] {
            ReactFiberHooksCurrent.hookNameInDev = "useTransition";
            updateHookTypesDev();
            return mountTransition();
        },

        useSyncExternalStore<T>( subscribe: ( arg0: () => void ) => () => void, getSnapshot: () => T, getServerSnapshot?: () => T ): T {
            ReactFiberHooksCurrent.hookNameInDev = "useSyncExternalStore";
            updateHookTypesDev();
            return mountSyncExternalStore( subscribe, getSnapshot, getServerSnapshot );
        },

        useId(): string {
            ReactFiberHooksCurrent.hookNameInDev = "useId";
            updateHookTypesDev();
            return mountId();
        }

    };

    if ( enableCache ) {
        ReactFiberHooksDispatcherInDEV.onMountWithHookTypes.useCacheRefresh = function useCacheRefresh() {
            ReactFiberHooksCurrent.hookNameInDev = "useCacheRefresh";
            updateHookTypesDev();
            return mountRefresh();
        };
    }

    if ( enableUseMemoCacheHook ) {
        ReactFiberHooksDispatcherInDEV.onMountWithHookTypes.useMemoCache = useMemoCache;
    }

    if ( enableUseEffectEventHook ) {
        ReactFiberHooksDispatcherInDEV.onMountWithHookTypes.useEffectEvent = function useEffectEvent( callback ): any {
            ReactFiberHooksCurrent.hookNameInDev = "useEffectEvent";
            updateHookTypesDev();

            return mountEvent( callback );
        };
    }

    if ( enableFormActions && enableAsyncActions ) {
        ReactFiberHooksDispatcherInDEV.onMountWithHookTypes.useHostTransitionStatus = useHostTransitionStatus;

        function useFormState<State, Payload>( action: ( state: State, payload: Payload ) => any, initialState: any, permalink: string | undefined ): any;
        function useFormState<State, Payload>( action: ( state: State | Promise<State>, payload: Payload ) => any, initialState: any, permalink: string | undefined ) {
            ReactFiberHooksCurrent.hookNameInDev = "useFormState";
            updateHookTypesDev();
            return mountFormState( action, initialState, permalink );
        }

        ReactFiberHooksDispatcherInDEV.onMountWithHookTypes.useFormState = useFormState;
    }

    if ( enableAsyncActions ) {
        ReactFiberHooksDispatcherInDEV.onMountWithHookTypes.useOptimistic = function useOptimistic<S, A>( passthrough: S, reducer: ( ( arg0: S, arg1: A ) => S ) | null | undefined ): [ S, ( arg0: A ) => void ] {
            ReactFiberHooksCurrent.hookNameInDev = "useOptimistic";
            updateHookTypesDev();
            return mountOptimistic( passthrough, reducer );
        };
    }

    ReactFiberHooksDispatcherInDEV.onUpdate = {
        readContext<T>( context: ReactContext<T> ): T {
            return readContext( context );
        },

        use,

        useCallback( callback, deps ) {
            ReactFiberHooksCurrent.hookNameInDev = "useCallback";
            updateHookTypesDev();
            return updateCallback( callback, deps );
        },

        useContext( context ) {
            ReactFiberHooksCurrent.hookNameInDev = "useContext";
            updateHookTypesDev();
            return readContext( context );
        },

        useEffect( create, deps ) {
            ReactFiberHooksCurrent.hookNameInDev = "useEffect";
            updateHookTypesDev();
            return updateEffect( create, deps );
        },

        useImperativeHandle( ref, create, deps ) {
            ReactFiberHooksCurrent.hookNameInDev = "useImperativeHandle";
            updateHookTypesDev();
            return updateImperativeHandle( ref, create, deps );
        },

        useInsertionEffect( create, deps ) {
            ReactFiberHooksCurrent.hookNameInDev = "useInsertionEffect";
            updateHookTypesDev();
            return updateInsertionEffect( create, deps );
        },

        useLayoutEffect( create, deps ) {
            ReactFiberHooksCurrent.hookNameInDev = "useLayoutEffect";
            updateHookTypesDev();
            return updateLayoutEffect( create, deps );
        },

        useMemo( create, deps ) {
            ReactFiberHooksCurrent.hookNameInDev = "useMemo";
            updateHookTypesDev();
            const prevDispatcher = ReactCurrentDispatcher.current;
            ReactCurrentDispatcher.current = ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onUpdate;

            try {
                return updateMemo( create, deps );
            } finally {
                ReactCurrentDispatcher.current = prevDispatcher;
            }
        },

        useReducer( reducer: any, initialArg: any, init: any ) {
            ReactFiberHooksCurrent.hookNameInDev = "useReducer";
            updateHookTypesDev();
            const prevDispatcher = ReactCurrentDispatcher.current;
            ReactCurrentDispatcher.current = ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onUpdate;

            try {
                return updateReducer( reducer, initialArg, init );
            } finally {
                ReactCurrentDispatcher.current = prevDispatcher;
            }
        },

        useRef( initialValue? ) {
            ReactFiberHooksCurrent.hookNameInDev = "useRef";
            updateHookTypesDev();
            return updateRef( initialValue );
        },

        useState( initialState? ) {
            ReactFiberHooksCurrent.hookNameInDev = "useState";
            updateHookTypesDev();
            const prevDispatcher = ReactCurrentDispatcher.current;
            ReactCurrentDispatcher.current = ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onUpdate;

            try {
                return updateState( initialState );
            } finally {
                ReactCurrentDispatcher.current = prevDispatcher;
            }
        },

        useDebugValue<T>( value: T, formatterFn: ( ( value: T ) => unknown ) | null | undefined ): void {
            ReactFiberHooksCurrent.hookNameInDev = "useDebugValue";
            updateHookTypesDev();
            return updateDebugValue( value, formatterFn );
        },

        useDeferredValue<T>( value: T, initialValue?: T ): T {
            ReactFiberHooksCurrent.hookNameInDev = "useDeferredValue";
            updateHookTypesDev();
            return updateDeferredValue( value, initialValue );
        },

        useTransition(): [ boolean, ( arg0: () => void ) => void ] {
            ReactFiberHooksCurrent.hookNameInDev = "useTransition";
            updateHookTypesDev();
            return updateTransition();
        },

        useSyncExternalStore<T>( subscribe: ( arg0: () => void ) => () => void, getSnapshot: () => T, getServerSnapshot?: () => T ): T {
            ReactFiberHooksCurrent.hookNameInDev = "useSyncExternalStore";
            updateHookTypesDev();
            return updateSyncExternalStore( subscribe, getSnapshot, getServerSnapshot );
        },

        useId(): string {
            ReactFiberHooksCurrent.hookNameInDev = "useId";
            updateHookTypesDev();
            return updateId();
        }

    };

    if ( enableCache ) {
        ReactFiberHooksDispatcherInDEV.onUpdate.useCacheRefresh = function useCacheRefresh() {
            ReactFiberHooksCurrent.hookNameInDev = "useCacheRefresh";
            updateHookTypesDev();
            return updateRefresh();
        };
    }

    if ( enableUseMemoCacheHook ) {
        ReactFiberHooksDispatcherInDEV.onUpdate.useMemoCache = useMemoCache;
    }

    if ( enableUseEffectEventHook ) {
        ReactFiberHooksDispatcherInDEV.onUpdate.useEffectEvent = function useEffectEvent<T extends Function>( callback: T ): T {
            ReactFiberHooksCurrent.hookNameInDev = "useEffectEvent";
            updateHookTypesDev();
            return updateEvent( callback );
        };
    }

    if ( enableFormActions && enableAsyncActions ) {
        ReactFiberHooksDispatcherInDEV.onUpdate.useHostTransitionStatus = useHostTransitionStatus;

        function useFormState<State, Payload>( action: ( state: State, payload: Payload ) => any, initialState: any, permalink: string | undefined ): any;
        function useFormState<State, Payload>( action: ( state: State | Promise<State>, payload: Payload ) => any, initialState: any, permalink: string | undefined ) {
            ReactFiberHooksCurrent.hookNameInDev = "useFormState";
            updateHookTypesDev();
            return updateFormState( action, initialState, permalink );
        }

        ReactFiberHooksDispatcherInDEV.onUpdate.useFormState = useFormState;
    }

    if ( enableAsyncActions ) {
        ReactFiberHooksDispatcherInDEV.onUpdate.useOptimistic = function useOptimistic<S, A>( passthrough: S, reducer: ( ( arg0: S, arg1: A ) => S ) | null | undefined ): [ S, ( arg0: A ) => void ] {
            ReactFiberHooksCurrent.hookNameInDev = "useOptimistic";
            updateHookTypesDev();
            return updateOptimistic( passthrough, reducer );
        };
    }

    ReactFiberHooksDispatcherInDEV.onRerender = {
        readContext<T>( context: ReactContext<T> ): T {
            return readContext( context );
        },

        use,

        useCallback( callback, deps ) {
            ReactFiberHooksCurrent.hookNameInDev = "useCallback";
            updateHookTypesDev();
            return updateCallback( callback, deps );
        },

        useContext( context ) {
            ReactFiberHooksCurrent.hookNameInDev = "useContext";
            updateHookTypesDev();
            return readContext( context );
        },

        useEffect( create, deps ) {
            ReactFiberHooksCurrent.hookNameInDev = "useEffect";
            updateHookTypesDev();
            return updateEffect( create, deps );
        },

        useImperativeHandle( ref, create, deps ) {
            ReactFiberHooksCurrent.hookNameInDev = "useImperativeHandle";
            updateHookTypesDev();
            return updateImperativeHandle( ref, create, deps );
        },

        useInsertionEffect( create, deps ) {
            ReactFiberHooksCurrent.hookNameInDev = "useInsertionEffect";
            updateHookTypesDev();
            return updateInsertionEffect( create, deps );
        },

        useLayoutEffect( create, deps ) {
            ReactFiberHooksCurrent.hookNameInDev = "useLayoutEffect";
            updateHookTypesDev();
            return updateLayoutEffect( create, deps );
        },

        useMemo( create, deps ) {
            ReactFiberHooksCurrent.hookNameInDev = "useMemo";
            updateHookTypesDev();
            const prevDispatcher = ReactCurrentDispatcher.current;
            ReactCurrentDispatcher.current = ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onRenderer;

            try {
                return updateMemo( create, deps );
            } finally {
                ReactCurrentDispatcher.current = prevDispatcher;
            }
        },

        useReducer( reducer: any, initialArg: any, init: any ) {
            ReactFiberHooksCurrent.hookNameInDev = "useReducer";
            updateHookTypesDev();
            const prevDispatcher = ReactCurrentDispatcher.current;
            ReactCurrentDispatcher.current = ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onRenderer;

            try {
                return rerenderReducer( reducer, initialArg, init );
            } finally {
                ReactCurrentDispatcher.current = prevDispatcher;
            }
        },

        useRef( initialValue? ) {
            ReactFiberHooksCurrent.hookNameInDev = "useRef";
            updateHookTypesDev();
            return updateRef( initialValue );
        },

        useState( initialState? ) {
            ReactFiberHooksCurrent.hookNameInDev = "useState";
            updateHookTypesDev();
            const prevDispatcher = ReactCurrentDispatcher.current;
            ReactCurrentDispatcher.current = ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onRenderer;

            try {
                return rerenderState( initialState );
            } finally {
                ReactCurrentDispatcher.current = prevDispatcher;
            }
        },

        useDebugValue<T>( value: T, formatterFn: ( ( value: T ) => unknown ) | null | undefined ): void {
            ReactFiberHooksCurrent.hookNameInDev = "useDebugValue";
            updateHookTypesDev();
            return updateDebugValue( value, formatterFn );
        },

        useDeferredValue<T>( value: T, initialValue?: T ): T {
            ReactFiberHooksCurrent.hookNameInDev = "useDeferredValue";
            updateHookTypesDev();
            return rerenderDeferredValue( value, initialValue );
        },

        useTransition(): [ boolean, ( arg0: () => void ) => void ] {
            ReactFiberHooksCurrent.hookNameInDev = "useTransition";
            updateHookTypesDev();
            return rerenderTransition();
        },

        useSyncExternalStore<T>( subscribe: ( arg0: () => void ) => () => void, getSnapshot: () => T, getServerSnapshot?: () => T ): T {
            ReactFiberHooksCurrent.hookNameInDev = "useSyncExternalStore";
            updateHookTypesDev();
            return updateSyncExternalStore( subscribe, getSnapshot, getServerSnapshot );
        },

        useId(): string {
            ReactFiberHooksCurrent.hookNameInDev = "useId";
            updateHookTypesDev();
            return updateId();
        }

    };

    if ( enableCache ) {
        ReactFiberHooksDispatcherInDEV.onRerender.useCacheRefresh = function useCacheRefresh() {
            ReactFiberHooksCurrent.hookNameInDev = "useCacheRefresh";
            updateHookTypesDev();
            return updateRefresh();
        };
    }

    if ( enableUseMemoCacheHook ) {
        ReactFiberHooksDispatcherInDEV.onRerender.useMemoCache = useMemoCache;
    }

    if ( enableUseEffectEventHook ) {
        ReactFiberHooksDispatcherInDEV.onRerender.useEffectEvent = function useEffectEvent<T extends Function>( callback: T ): T {
            ReactFiberHooksCurrent.hookNameInDev = "useEffectEvent";
            updateHookTypesDev();
            return updateEvent( callback );
        };
    }

    if ( enableFormActions && enableAsyncActions ) {
        ReactFiberHooksDispatcherInDEV.onRerender.useHostTransitionStatus = useHostTransitionStatus;

        function useFormState<State, Payload>( action: ( state: State, payload: Payload ) => any, initialState: any, permalink: string | undefined ): any;
        function useFormState<State, Payload>( action: ( state: State | Promise<State>, payload: Payload ) => any, initialState: any, permalink: string | undefined ) {
            ReactFiberHooksCurrent.hookNameInDev = "useFormState";
            updateHookTypesDev();
            return rerenderFormState( action, initialState, permalink );
        }

        ReactFiberHooksDispatcherInDEV.onRerender.useFormState = useFormState;
    }

    if ( enableAsyncActions ) {
        ReactFiberHooksDispatcherInDEV.onRerender.useOptimistic = function useOptimistic<S, A>( passthrough: S, reducer: ( ( arg0: S, arg1: A ) => S ) | null | undefined ): [ S, ( arg0: A ) => void ] {
            ReactFiberHooksCurrent.hookNameInDev = "useOptimistic";
            updateHookTypesDev();
            return rerenderOptimistic( passthrough, reducer );
        };
    }

    ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onMount = {
        readContext<T>( context: ReactContext<T> ): T {
            warnInvalidContextAccess();
            return readContext( context );
        },

        use<T>( usable: Usable<T> ): T {
            warnInvalidHookAccess();
            return use( usable );
        },

        useCallback( callback, deps ) {
            ReactFiberHooksCurrent.hookNameInDev = "useCallback";
            warnInvalidHookAccess();
            mountHookTypesDev();
            return mountCallback( callback, deps );
        },

        useContext( context ) {
            ReactFiberHooksCurrent.hookNameInDev = "useContext";
            warnInvalidHookAccess();
            mountHookTypesDev();
            return readContext( context );
        },

        useEffect( create, deps ) {
            ReactFiberHooksCurrent.hookNameInDev = "useEffect";
            warnInvalidHookAccess();
            mountHookTypesDev();
            return mountEffect( create, deps );
        },

        useImperativeHandle( ref, create, deps ) {
            ReactFiberHooksCurrent.hookNameInDev = "useImperativeHandle";
            warnInvalidHookAccess();
            mountHookTypesDev();
            return mountImperativeHandle( ref, create, deps );
        },

        useInsertionEffect( create, deps ) {
            ReactFiberHooksCurrent.hookNameInDev = "useInsertionEffect";
            warnInvalidHookAccess();
            mountHookTypesDev();
            return mountInsertionEffect( create, deps );
        },

        useLayoutEffect( create, deps ) {
            ReactFiberHooksCurrent.hookNameInDev = "useLayoutEffect";
            warnInvalidHookAccess();
            mountHookTypesDev();
            return mountLayoutEffect( create, deps );
        },

        useMemo( create, deps ) {
            ReactFiberHooksCurrent.hookNameInDev = "useMemo";
            warnInvalidHookAccess();
            mountHookTypesDev();
            const prevDispatcher = ReactCurrentDispatcher.current;
            ReactCurrentDispatcher.current = ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onMount;

            try {
                return mountMemo( create, deps );
            } finally {
                ReactCurrentDispatcher.current = prevDispatcher;
            }
        },

        useReducer( reducer: any, initialArg: any, init: any ) {
            ReactFiberHooksCurrent.hookNameInDev = "useReducer";
            warnInvalidHookAccess();
            mountHookTypesDev();
            const prevDispatcher = ReactCurrentDispatcher.current;
            ReactCurrentDispatcher.current = ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onMount;

            try {
                return mountReducer( reducer, initialArg, init );
            } finally {
                ReactCurrentDispatcher.current = prevDispatcher;
            }
        },

        useRef( initialValue?: any ) {
            ReactFiberHooksCurrent.hookNameInDev = "useRef";
            warnInvalidHookAccess();
            mountHookTypesDev();
            return mountRef( initialValue );
        },

        useState( initialState?: any ) {
            ReactFiberHooksCurrent.hookNameInDev = "useState";
            warnInvalidHookAccess();
            mountHookTypesDev();
            const prevDispatcher = ReactCurrentDispatcher.current;
            ReactCurrentDispatcher.current = ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onMount;

            try {
                return mountState( initialState );
            } finally {
                ReactCurrentDispatcher.current = prevDispatcher;
            }
        },

        useDebugValue<T>( value: T, formatterFn: ( ( value: T ) => unknown ) | null | undefined ): void {
            ReactFiberHooksCurrent.hookNameInDev = "useDebugValue";
            warnInvalidHookAccess();
            mountHookTypesDev();
            return mountDebugValue( value, formatterFn );
        },

        useDeferredValue<T>( value: T, initialValue?: T ): T {
            ReactFiberHooksCurrent.hookNameInDev = "useDeferredValue";
            warnInvalidHookAccess();
            mountHookTypesDev();
            return mountDeferredValue( value, initialValue );
        },

        useTransition(): [ boolean, ( arg0: () => void ) => void ] {
            ReactFiberHooksCurrent.hookNameInDev = "useTransition";
            warnInvalidHookAccess();
            mountHookTypesDev();
            return mountTransition();
        },

        useSyncExternalStore<T>( subscribe: ( arg0: () => void ) => () => void, getSnapshot: () => T, getServerSnapshot?: () => T ): T {
            ReactFiberHooksCurrent.hookNameInDev = "useSyncExternalStore";
            warnInvalidHookAccess();
            mountHookTypesDev();
            return mountSyncExternalStore( subscribe, getSnapshot, getServerSnapshot );
        },

        useId(): string {
            ReactFiberHooksCurrent.hookNameInDev = "useId";
            warnInvalidHookAccess();
            mountHookTypesDev();
            return mountId();
        }

    };

    if ( enableCache ) {
        ( ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onMount as Dispatcher ).useCacheRefresh = function useCacheRefresh() {
            ReactFiberHooksCurrent.hookNameInDev = "useCacheRefresh";
            mountHookTypesDev();
            return mountRefresh();
        };
    }

    if ( enableUseMemoCacheHook ) {
        ( ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onMount as Dispatcher ).useMemoCache = function ( size: number ): Array<any> {
            warnInvalidHookAccess();
            return useMemoCache( size );
        };
    }

    if ( enableUseEffectEventHook ) {
        ( ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onMount as Dispatcher ).useEffectEvent = function useEffectEvent<T extends Function>( callback: T ): T {
            ReactFiberHooksCurrent.hookNameInDev = "useEffectEvent";
            warnInvalidHookAccess();
            mountHookTypesDev();
            return mountEvent( callback );
        };
    }

    if ( enableFormActions && enableAsyncActions ) {
        ( ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onMount as Dispatcher ).useHostTransitionStatus = useHostTransitionStatus;

        function useFormState<State, Payload>( action: ( state: State, payload: Payload ) => any, initialState: any, permalink: string | undefined ): any;
        function useFormState<State, Payload>( action: ( state: State | Promise<State>, payload: Payload ) => any, initialState: any, permalink: string | undefined ) {
            ReactFiberHooksCurrent.hookNameInDev = "useFormState";
            warnInvalidHookAccess();
            mountHookTypesDev();
            return mountFormState( action, initialState, permalink );
        }

        ( ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onMount as Dispatcher ).useFormState = useFormState;
    }

    if ( enableAsyncActions ) {
        ( ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onMount as Dispatcher ).useOptimistic = function useOptimistic<S, A>( passthrough: S, reducer: ( ( arg0: S, arg1: A ) => S ) | null | undefined ): [ S, ( arg0: A ) => void ] {
            ReactFiberHooksCurrent.hookNameInDev = "useOptimistic";
            warnInvalidHookAccess();
            mountHookTypesDev();
            return mountOptimistic( passthrough, reducer );
        };
    }

    ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onUpdate = {
        readContext<T>( context: ReactContext<T> ): T {
            warnInvalidContextAccess();
            return readContext( context );
        },

        use<T>( usable: Usable<T> ): T {
            warnInvalidHookAccess();
            return use( usable );
        },

        useCallback( callback, deps ) {
            ReactFiberHooksCurrent.hookNameInDev = "useCallback";
            warnInvalidHookAccess();
            updateHookTypesDev();
            return updateCallback( callback, deps );
        },

        useContext( context ) {
            ReactFiberHooksCurrent.hookNameInDev = "useContext";
            warnInvalidHookAccess();
            updateHookTypesDev();
            return readContext( context );
        },

        useEffect( create, deps ) {
            ReactFiberHooksCurrent.hookNameInDev = "useEffect";
            warnInvalidHookAccess();
            updateHookTypesDev();
            return updateEffect( create, deps );
        },

        useImperativeHandle( ref, create, deps ) {
            ReactFiberHooksCurrent.hookNameInDev = "useImperativeHandle";
            warnInvalidHookAccess();
            updateHookTypesDev();
            return updateImperativeHandle( ref, create, deps );
        },

        useInsertionEffect( create, deps ) {
            ReactFiberHooksCurrent.hookNameInDev = "useInsertionEffect";
            warnInvalidHookAccess();
            updateHookTypesDev();
            return updateInsertionEffect( create, deps );
        },

        useLayoutEffect( create, deps ) {
            ReactFiberHooksCurrent.hookNameInDev = "useLayoutEffect";
            warnInvalidHookAccess();
            updateHookTypesDev();
            return updateLayoutEffect( create, deps );
        },

        useMemo( create, deps ) {
            ReactFiberHooksCurrent.hookNameInDev = "useMemo";
            warnInvalidHookAccess();
            updateHookTypesDev();
            const prevDispatcher = ReactCurrentDispatcher.current;
            ReactCurrentDispatcher.current = ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onUpdate;

            try {
                return updateMemo( create, deps );
            } finally {
                ReactCurrentDispatcher.current = prevDispatcher;
            }
        },

        useReducer( reducer: any, initialArg: any, init: any ) {
            ReactFiberHooksCurrent.hookNameInDev = "useReducer";
            warnInvalidHookAccess();
            updateHookTypesDev();
            const prevDispatcher = ReactCurrentDispatcher.current;
            ReactCurrentDispatcher.current = ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onUpdate;

            try {
                return updateReducer( reducer, initialArg, init );
            } finally {
                ReactCurrentDispatcher.current = prevDispatcher;
            }
        },

        useRef( initialValue? ) {
            ReactFiberHooksCurrent.hookNameInDev = "useRef";
            warnInvalidHookAccess();
            updateHookTypesDev();
            return updateRef( initialValue );
        },

        useState( initialState? ) {
            ReactFiberHooksCurrent.hookNameInDev = "useState";
            warnInvalidHookAccess();
            updateHookTypesDev();
            const prevDispatcher = ReactCurrentDispatcher.current;
            ReactCurrentDispatcher.current = ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onUpdate;

            try {
                return updateState( initialState );
            } finally {
                ReactCurrentDispatcher.current = prevDispatcher;
            }
        },

        useDebugValue<T>( value: T, formatterFn: ( ( value: T ) => unknown ) | null | undefined ): void {
            ReactFiberHooksCurrent.hookNameInDev = "useDebugValue";
            warnInvalidHookAccess();
            updateHookTypesDev();
            return updateDebugValue( value, formatterFn );
        },

        useDeferredValue<T>( value: T, initialValue?: T ): T {
            ReactFiberHooksCurrent.hookNameInDev = "useDeferredValue";
            warnInvalidHookAccess();
            updateHookTypesDev();
            return updateDeferredValue( value, initialValue );
        },

        useTransition(): [ boolean, ( arg0: () => void ) => void ] {
            ReactFiberHooksCurrent.hookNameInDev = "useTransition";
            warnInvalidHookAccess();
            updateHookTypesDev();
            return updateTransition();
        },

        useSyncExternalStore<T>( subscribe: ( arg0: () => void ) => () => void, getSnapshot: () => T, getServerSnapshot?: () => T ): T {
            ReactFiberHooksCurrent.hookNameInDev = "useSyncExternalStore";
            warnInvalidHookAccess();
            updateHookTypesDev();
            return updateSyncExternalStore( subscribe, getSnapshot, getServerSnapshot );
        },

        useId(): string {
            ReactFiberHooksCurrent.hookNameInDev = "useId";
            warnInvalidHookAccess();
            updateHookTypesDev();
            return updateId();
        }

    };

    if ( enableCache ) {
        ( ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onUpdate as Dispatcher ).useCacheRefresh = function useCacheRefresh() {
            ReactFiberHooksCurrent.hookNameInDev = "useCacheRefresh";
            updateHookTypesDev();
            return updateRefresh();
        };
    }

    if ( enableUseMemoCacheHook ) {
        ( ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onUpdate as Dispatcher ).useMemoCache = function ( size: number ): Array<any> {
            warnInvalidHookAccess();
            return useMemoCache( size );
        };
    }

    if ( enableUseEffectEventHook ) {
        ( ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onUpdate as Dispatcher ).useEffectEvent = function useEffectEvent<T extends Function>( callback: T ): T {
            ReactFiberHooksCurrent.hookNameInDev = "useEffectEvent";
            warnInvalidHookAccess();
            updateHookTypesDev();
            return updateEvent( callback );
        };
    }

    if ( enableFormActions && enableAsyncActions ) {
        ( ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onUpdate as Dispatcher ).useHostTransitionStatus = useHostTransitionStatus;

        function useFormState<State, Payload>( action: ( state: State, payload: Payload ) => any, initialState: any, permalink: string | undefined ): any;
        function useFormState<State, Payload>( action: ( state: State | Promise<State>, payload: Payload ) => any, initialState: any, permalink: string | undefined ) {
            ReactFiberHooksCurrent.hookNameInDev = "useFormState";
            warnInvalidHookAccess();
            updateHookTypesDev();
            return updateFormState( action, initialState, permalink );
        }

        ( ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onUpdate as Dispatcher ).useFormState = useFormState;
    }

    if ( enableAsyncActions ) {
        ( ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onUpdate as Dispatcher ).useOptimistic = function useOptimistic<S, A>( passthrough: S, reducer: ( ( arg0: S, arg1: A ) => S ) | null | undefined ): [ S, ( arg0: A ) => void ] {
            ReactFiberHooksCurrent.hookNameInDev = "useOptimistic";
            warnInvalidHookAccess();
            updateHookTypesDev();
            return updateOptimistic( passthrough, reducer );
        };
    }

    ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onRenderer = {
        readContext<T>( context: ReactContext<T> ): T {
            warnInvalidContextAccess();
            return readContext( context );
        },

        use<T>( usable: Usable<T> ): T {
            warnInvalidHookAccess();
            return use( usable );
        },

        useCallback( callback, deps ) {
            ReactFiberHooksCurrent.hookNameInDev = "useCallback";
            warnInvalidHookAccess();
            updateHookTypesDev();
            return updateCallback( callback, deps );
        },

        useContext( context ) {
            ReactFiberHooksCurrent.hookNameInDev = "useContext";
            warnInvalidHookAccess();
            updateHookTypesDev();
            return readContext( context );
        },

        useEffect( create, deps ): void {
            ReactFiberHooksCurrent.hookNameInDev = "useEffect";
            warnInvalidHookAccess();
            updateHookTypesDev();
            return updateEffect( create, deps );
        },

        useImperativeHandle( ref, create, deps ) {
            ReactFiberHooksCurrent.hookNameInDev = "useImperativeHandle";
            warnInvalidHookAccess();
            updateHookTypesDev();
            return updateImperativeHandle( ref, create, deps );
        },

        useInsertionEffect( create, deps ): void {
            ReactFiberHooksCurrent.hookNameInDev = "useInsertionEffect";
            warnInvalidHookAccess();
            updateHookTypesDev();
            return updateInsertionEffect( create, deps );
        },

        useLayoutEffect( create, deps ): void {
            ReactFiberHooksCurrent.hookNameInDev = "useLayoutEffect";
            warnInvalidHookAccess();
            updateHookTypesDev();
            return updateLayoutEffect( create, deps );
        },

        useMemo( create, deps ) {
            ReactFiberHooksCurrent.hookNameInDev = "useMemo";
            warnInvalidHookAccess();
            updateHookTypesDev();
            const prevDispatcher = ReactCurrentDispatcher.current;
            ReactCurrentDispatcher.current = ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onUpdate;

            try {
                return updateMemo( create, deps );
            } finally {
                ReactCurrentDispatcher.current = prevDispatcher;
            }
        },

        useReducer: ( reducer: any, initialArg: any, init: any ) => {
            ReactFiberHooksCurrent.hookNameInDev = "useReducer";
            warnInvalidHookAccess();
            updateHookTypesDev();
            const prevDispatcher = ReactCurrentDispatcher.current;
            ReactCurrentDispatcher.current = ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onUpdate;

            try {
                return rerenderReducer( reducer, initialArg, init );
            } finally {
                ReactCurrentDispatcher.current = prevDispatcher;
            }
        },

        useRef( initialValue? ) {
            ReactFiberHooksCurrent.hookNameInDev = "useRef";
            warnInvalidHookAccess();
            updateHookTypesDev();
            return updateRef( initialValue );
        },

        useState( initialState? ) {
            ReactFiberHooksCurrent.hookNameInDev = "useState";
            warnInvalidHookAccess();
            updateHookTypesDev();
            const prevDispatcher = ReactCurrentDispatcher.current;
            ReactCurrentDispatcher.current = ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onUpdate;

            try {
                return rerenderState( initialState );
            } finally {
                ReactCurrentDispatcher.current = prevDispatcher;
            }
        },

        useDebugValue<T>( value: T, formatterFn: ( ( value: T ) => unknown ) | null | undefined ): void {
            ReactFiberHooksCurrent.hookNameInDev = "useDebugValue";
            warnInvalidHookAccess();
            updateHookTypesDev();
            return updateDebugValue( value, formatterFn );
        },

        useDeferredValue<T>( value: T, initialValue?: T ): T {
            ReactFiberHooksCurrent.hookNameInDev = "useDeferredValue";
            warnInvalidHookAccess();
            updateHookTypesDev();
            return rerenderDeferredValue( value, initialValue );
        },

        useTransition(): [ boolean, ( arg0: () => void ) => void ] {
            ReactFiberHooksCurrent.hookNameInDev = "useTransition";
            warnInvalidHookAccess();
            updateHookTypesDev();
            return rerenderTransition();
        },

        useSyncExternalStore<T>( subscribe: ( arg0: () => void ) => () => void, getSnapshot: () => T, getServerSnapshot?: () => T ): T {
            ReactFiberHooksCurrent.hookNameInDev = "useSyncExternalStore";
            warnInvalidHookAccess();
            updateHookTypesDev();
            return updateSyncExternalStore( subscribe, getSnapshot, getServerSnapshot );
        },

        useId(): string {
            ReactFiberHooksCurrent.hookNameInDev = "useId";
            warnInvalidHookAccess();
            updateHookTypesDev();
            return updateId();
        }

    };

    if ( enableCache ) {
        ( ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onRenderer as Dispatcher ).useCacheRefresh = function useCacheRefresh() {
            ReactFiberHooksCurrent.hookNameInDev = "useCacheRefresh";
            updateHookTypesDev();
            return updateRefresh();
        };
    }

    if ( enableUseMemoCacheHook ) {
        ( ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onRenderer as Dispatcher ).useMemoCache = function ( size: number ): Array<any> {
            warnInvalidHookAccess();
            return useMemoCache( size );
        };
    }

    if ( enableUseEffectEventHook ) {
        ( ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onRenderer as Dispatcher ).useEffectEvent = function useEffectEvent<T extends Function>( callback: T ): T {
            ReactFiberHooksCurrent.hookNameInDev = "useEffectEvent";
            warnInvalidHookAccess();
            updateHookTypesDev();

            return updateEvent( callback ) as unknown as T;
        };
    }

    if ( enableFormActions && enableAsyncActions ) {
        ( ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onRenderer as Dispatcher ).useHostTransitionStatus = useHostTransitionStatus;

        function useFormState<State, Payload>( action: ( state: State, payload: Payload ) => any, initialState: any, permalink: string | undefined ): any;
        function useFormState<State, Payload>( action: ( state: State | Promise<State>, payload: Payload ) => any, initialState: any, permalink: string | undefined ) {
            ReactFiberHooksCurrent.hookNameInDev = "useFormState";
            mountHookTypesDev();

            return rerenderFormState( action, initialState, permalink );
        };

        ( ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onRenderer as Dispatcher ).useFormState = useFormState;
    }

    if ( enableAsyncActions ) {
        ( ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onRenderer as Dispatcher ).useOptimistic = function useOptimistic<S, A>( passthrough: S, reducer: ( ( arg0: S, arg1: A ) => S ) | null | undefined ): [ S, ( arg0: A ) => void ] {
            ReactFiberHooksCurrent.hookNameInDev = "useOptimistic";
            warnInvalidHookAccess();
            updateHookTypesDev();
            return rerenderOptimistic( passthrough, reducer );
        };
    }
}

export function renderWithHooks<Props, SecondArg>( current: Fiber | null, workInProgress: Fiber, Component: ( p: Props, arg: SecondArg ) => any, props: Props, secondArg: SecondArg, nextRenderLanes: Lanes ): any {
    ReactFiberHooksCurrent.renderLanes = nextRenderLanes;
    ReactFiberHooksCurrent.renderingFiber = workInProgress;

    if ( __DEV__ ) {
        ReactFiberHooksCurrent.hookTypesDev = current !== null ? ( ( current._debugHookTypes as any ) as Array<HookType> ) : null;
        ReactFiberHooksCurrent.hookTypesUpdateIndexDev = -1;
        // Used for hot reloading:
        ReactFiberHooksInfra.ignorePreviousDependencies = current !== null && current.type !== workInProgress.type;
    }

    workInProgress.memoizedState = null;
    workInProgress.updateQueue = null;
    workInProgress.lanes = NoLanes;

    // The following should have already been reset
    // ReactFiberHooksCurrent.hook = null;
    // ReactFiberHooksCurrent.workInProgressHook = null;
    // ReactFiberHooksFlags.didScheduleRenderPhaseUpdate = false;
    // ReactFiberHooksCurrent.localIdCounter = 0;
    // ReactFiberHooksCurrent.thenableIndexCounter = 0;
    // ReactFiberHooksCurrent.thenableState = null;
    // TODO Warn if no hooks are used at all during mount, then some are used during update.
    // Currently we will identify the update render as a mount because memoizedState === null.
    // This is tricky because it's valid for certain types of components (e.g. React.lazy)
    // Using memoizedState to differentiate between mount/update only works if at least one stateful hook is used.
    // Non-stateful hooks (e.g. context) don't get added to memoizedState,
    // so memoizedState would be null during updates and mounts.
    if ( __DEV__ ) {
        if ( current !== null && current.memoizedState !== null ) {
            ReactCurrentDispatcher.current = ReactFiberHooksDispatcherInDEV.onUpdate;
        } else if ( ReactFiberHooksCurrent.hookTypesDev !== null ) {
            // This dispatcher handles an edge case where a component is updating,
            // but no stateful hooks have been used.
            // We want to match the production code behavior (which will use HooksDispatcherOnMount),
            // but with the extra DEV validation to ensure hooks ordering hasn't changed.
            // This dispatcher does that.
            ReactCurrentDispatcher.current = ReactFiberHooksDispatcherInDEV.onMountWithHookTypes;
        } else {
            ReactCurrentDispatcher.current = ReactFiberHooksDispatcherInDEV.onMount;
        }
    } else {
        ReactCurrentDispatcher.current = current === null || current.memoizedState === null ?
            ReactFiberHooksDispatcher.onMount :
            ReactFiberHooksDispatcher.onUpdate;
    }

    // In Strict Mode, during development, user functions are double invoked to
    // help detect side effects. The logic for how this is implemented for in
    // hook components is a bit complex so let's break it down.
    //
    // We will invoke the entire component function twice. However, during the
    // second invocation of the component, the hook state from the first
    // invocation will be reused. That means things like `useMemo` functions won't
    // run again, because the deps will match and the memoized result will
    // be reused.
    //
    // We want memoized functions to run twice, too, so account for this, user
    // functions are double invoked during the *first* invocation of the component
    // function, and are *not* double invoked during the second incovation:
    //
    // - First execution of component function: user functions are double invoked
    // - Second execution of component function (in Strict Mode, during
    //   development): user functions are not double invoked.
    //
    // This is intentional for a few reasons; most importantly, it's because of
    // how `use` works when something suspends: it reuses the promise that was
    // passed during the first attempt. This is itself a form of memoization.
    // We need to be able to memoize the reactive inputs to the `use` call using
    // a hook (i.e. `useMemo`), which means, the reactive inputs to `use` must
    // come from the same component invocation as the output.
    //
    // There are plenty of tests to ensure this behavior is correct.
    const shouldDoubleRenderDEV = __DEV__ && debugRenderPhaseSideEffectsForStrictMode && ( workInProgress.mode & TypeOfMode.StrictLegacyMode ) !== TypeOfMode.NoMode;
    ReactFiberHooksInfra.shouldDoubleInvokeUserFnsInHooksDEV = shouldDoubleRenderDEV;
    let children = Component( props, secondArg );
    ReactFiberHooksInfra.shouldDoubleInvokeUserFnsInHooksDEV = false;

    // Check if there was a render phase update
    if ( ReactFiberHooksFlags.didScheduleRenderPhaseUpdateDuringThisPass ) {
        // Keep rendering until the component stabilizes (there are no more render
        // phase updates).
        children = renderWithHooksAgain( workInProgress, Component, props, secondArg );
    }

    if ( shouldDoubleRenderDEV ) {
        // In development, components are invoked twice to help detect side effects.
        setIsStrictModeForDevtools( true );

        try {
            children = renderWithHooksAgain( workInProgress, Component, props, secondArg );
        } finally {
            setIsStrictModeForDevtools( false );
        }
    }

    finishRenderingHooks( current, workInProgress, Component );
    return children;
}

export function replaySuspendedComponentWithHooks<Props, SecondArg>( current: Fiber | null, workInProgress: Fiber, Component: ( p: Props, arg: SecondArg ) => any, props: Props, secondArg: SecondArg ): any {
    // This function is used to replay a component that previously suspended,
    // after its data resolves.
    //
    // It's a simplified version of renderWithHooks, but it doesn't need to do
    // most of the set up work because they weren't reset when we suspended; they
    // only get reset when the component either completes (finishRenderingHooks)
    // or unwinds (resetHooksOnUnwind).
    if ( __DEV__ ) {
        ReactFiberHooksCurrent.hookTypesUpdateIndexDev = -1;
        // Used for hot reloading:
        ReactFiberHooksInfra.ignorePreviousDependencies = current !== null && current.type !== workInProgress.type;
    }

    const children = renderWithHooksAgain( workInProgress, Component, props, secondArg );
    finishRenderingHooks( current, workInProgress, Component );
    return children;
}

export function renderTransitionAwareHostComponentWithHooks( current: Fiber | null, workInProgress: Fiber, lanes: Lanes ): TransitionStatus {
    if ( ! ( enableFormActions && enableAsyncActions ) ) {
        throw new Error( "Not implemented." );
    }

    return renderWithHooks( current, workInProgress, transitionAwareHostComponent, null, null, lanes );
}

// TODO: Remove exports if they end up not being used.
export function transitionAwareHostComponent(): TransitionStatus {
    if ( ! ( enableFormActions && enableAsyncActions ) ) {
        throw new Error( "Not implemented." );
    }

    const dispatcher = ReactCurrentDispatcher.current;

    if ( ! dispatcher ) {
        throw new Error( "Invalid dispatcher" );
    }

    const [ maybeThenable ] = dispatcher.useState();

    if ( typeof ( maybeThenable as unknown as Thenable<TransitionStatus> ).then === "function" ) {
        const thenable: Thenable<TransitionStatus> = ( maybeThenable as any );
        return useThenable( thenable );
    } else {
        // @ts-ignore
        const status: TransitionStatus = maybeThenable;
        return status;
    }
}

export function checkDidRenderIdHook(): boolean {
    // This should be called immediately after every renderWithHooks call.
    // Conceptually, it's part of the return value of renderWithHooks; it's only a
    // separate function to avoid using an array tuple.
    const didRenderIdHook = ReactFiberHooksCurrent.localIdCounter !== 0;
    ReactFiberHooksCurrent.localIdCounter = 0;
    return didRenderIdHook;
}

export function bailoutHooks( current: Fiber, workInProgress: Fiber, lanes: Lanes ): void {
    workInProgress.updateQueue = current.updateQueue;

    // TODO: Don't need to reset the flags here, because they're reset in the
    // complete phase (bubbleProperties).
    if ( __DEV__ && ( workInProgress.mode & TypeOfMode.StrictEffectsMode ) !== TypeOfMode.NoMode ) {
        workInProgress.flags &= ~( FiberFlags.MountPassiveDev | FiberFlags.MountLayoutDev | FiberFlags.Passive | FiberFlags.Update );
    } else {
        workInProgress.flags &= ~( FiberFlags.Passive | FiberFlags.Update );
    }

    current.lanes = removeLanes( current.lanes, lanes );
}

export function resetHooksAfterThrow(): void {
    // This is called immediaetly after a throw. It shouldn't reset the entire
    // module state, because the work loop might decide to replay the component
    // again without rewinding.
    //
    // It should only reset things like the current dispatcher, to prevent hooks
    // from being called outside of a component.
    ReactFiberHooksCurrent.renderingFiber = ( null as any );
    // We can assume the previous dispatcher is always this one, since we set it
    // at the beginning of the render phase and there's no re-entrance.
    ReactCurrentDispatcher.current = ReactFiberHooksDispatcher.contextOnly;
}

export function startHostTransition<F>( formFiber: Fiber, pendingState: TransitionStatus, callback: ( arg0: F ) => unknown, formData: F ): void {
    if ( ! enableFormActions ) {
        // Not implemented.
        return;
    }

    if ( ! enableAsyncActions ) {
        // Form actions are enabled, but async actions are not. Call the function,
        // but don't handle any pending or error states.
        callback( formData );
        return;
    }

    if ( formFiber.tag !== WorkTag.HostComponent ) {
        throw new Error( "Expected the form instance to be a HostComponent. This " + "is a bug in React." );
    }

    let queue: HookUpdateQueue<Thenable<TransitionStatus> | TransitionStatus, BasicStateAction<Thenable<TransitionStatus> | TransitionStatus>>;

    if ( formFiber.memoizedState === null ) {
        // Upgrade this host component fiber to be stateful. We're going to pretend
        // it was stateful all along so we can reuse most of the implementation
        // for function components and useTransition.
        //
        // Create the state hook used by TransitionAwareHostComponent. This is
        // essentially an inlined version of mountState.
        const newQueue: HookUpdateQueue<Thenable<TransitionStatus> | TransitionStatus, BasicStateAction<Thenable<TransitionStatus> | TransitionStatus>> = {
            pending: null,
            lanes: NoLanes,
            // We're going to cheat and intentionally not create a bound dispatch
            // method, because we can call it directly in startTransition.
            dispatch: ( null as any ),
            lastRenderedReducer: basicStateReducer,
            lastRenderedState: NoPendingHostTransition
        };
        queue = newQueue;
        const stateHook: Hook = {
            memoizedState: NoPendingHostTransition,
            baseState: NoPendingHostTransition,
            baseQueue: null,
            queue: newQueue,
            next: null
        };
        // Add the state hook to both fiber alternates. The idea is that the fiber
        // had this hook all along.
        formFiber.memoizedState = stateHook;
        const alternate = formFiber.alternate;

        if ( alternate !== null ) {
            alternate.memoizedState = stateHook;
        }
    } else {
        // This fiber was already upgraded to be stateful.
        const stateHook: Hook = formFiber.memoizedState;
        queue = stateHook.queue;
    }

    startTransition( formFiber, queue, pendingState, NoPendingHostTransition, // TODO: We can avoid this extra wrapper, somehow. Figure out layering
        // once more of this function is implemented.
        () => callback( formData ) );
}
