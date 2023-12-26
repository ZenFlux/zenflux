import {
    enableDebugTracing,
    enableSchedulingProfiler,
    enableUseMemoCacheHook
} from "@zenflux/react-shared/src/react-feature-flags";

import is from "@zenflux/react-shared/src/object-is";

import { TypeOfMode } from "@zenflux/react-shared/src/react-internal-constants/type-of-mode";

import {
    ReactFiberHooksCurrent,
    ReactFiberHooksFlags,
    ReactFiberHooksInfra
} from "@zenflux/react-reconciler/src/react-fiber-hooks-shared";

import reactGetComponentNameFromFiber from "@zenflux/react-reconciler/src/react-get-component-name-from-fiber";
import { logStateUpdateScheduled } from "@zenflux/react-reconciler/src/react-debug-tracing";
import { markStateUpdateScheduled } from "@zenflux/react-reconciler/src/react-fiber-dev-tools-hook";

import type { Fiber, HookUpdateQueue, Lane } from "@zenflux/react-shared/src/react-internal-types";
import type { DependencyList, Hook } from "@zenflux/react-reconciler/src/react-fiber-hooks-types";
import type { HookUpdate } from "@zenflux/react-shared/src/react-internal-types/update";

if ( enableUseMemoCacheHook ) {
    ReactFiberHooksInfra.createFunctionComponentUpdateQueue = () => {
        return {
            lastEffect: null,
            events: null,
            stores: null,
            memoCache: null
        };
    };
} else {
    ReactFiberHooksInfra.createFunctionComponentUpdateQueue = () => {
        return {
            lastEffect: null,
            events: null,
            stores: null
        };
    };
}

export function mountWorkInProgressHook(): Hook {
    const hook: Hook = {
        memoizedState: null,
        baseState: null,
        baseQueue: null,
        queue: null,
        next: null
    };

    if ( ReactFiberHooksCurrent.workInProgressHook === null ) {
        // This is the first hook in the list
        ReactFiberHooksCurrent.renderingFiber.memoizedState = ReactFiberHooksCurrent.workInProgressHook = hook;
    } else {
        // Append to the end of the list
        ReactFiberHooksCurrent.workInProgressHook = ReactFiberHooksCurrent.workInProgressHook.next = hook;
    }

    return ReactFiberHooksCurrent.workInProgressHook;
}

export function updateWorkInProgressHook(): Hook {
    // This function is used both for updates and for re-renders triggered by a
    // render phase update. It assumes there is either a current hook we can
    // clone, or a work-in-progress hook from a previous render pass that we can
    // use as a base.
    let nextCurrentHook: null | Hook;

    if ( ReactFiberHooksCurrent.hook === null ) {
        const current = ReactFiberHooksCurrent.renderingFiber.alternate;

        if ( current !== null ) {
            nextCurrentHook = current.memoizedState;
        } else {
            nextCurrentHook = null;
        }
    } else {
        nextCurrentHook = ReactFiberHooksCurrent.hook.next;
    }

    let nextWorkInProgressHook: null | Hook;

    if ( ReactFiberHooksCurrent.workInProgressHook === null ) {
        nextWorkInProgressHook = ReactFiberHooksCurrent.renderingFiber.memoizedState;
    } else {
        nextWorkInProgressHook = ReactFiberHooksCurrent.workInProgressHook.next;
    }

    if ( nextWorkInProgressHook !== null ) {
        // There's already a work-in-progress. Reuse it.
        ReactFiberHooksCurrent.workInProgressHook = nextWorkInProgressHook;
        nextWorkInProgressHook = ReactFiberHooksCurrent.workInProgressHook.next;
        ReactFiberHooksCurrent.hook = nextCurrentHook;
    } else {
        // Clone from the current hook.
        if ( nextCurrentHook === null ) {
            const currentFiber = ReactFiberHooksCurrent.renderingFiber.alternate;

            if ( currentFiber === null ) {
                // This is the initial render. This branch is reached when the component
                // suspends, resumes, then renders an additional hook.
                // Should never be reached because we should switch to the mount dispatcher first.
                throw new Error( "Update hook called on initial render. This is likely a bug in React. Please file an issue." );
            } else {
                // This is an update. We should always have a current hook.
                throw new Error( "Rendered more hooks than during the previous render." );
            }
        }

        ReactFiberHooksCurrent.hook = nextCurrentHook;
        const newHook: Hook = {
            memoizedState: ReactFiberHooksCurrent.hook.memoizedState,
            baseState: ReactFiberHooksCurrent.hook.baseState,
            baseQueue: ReactFiberHooksCurrent.hook.baseQueue,
            queue: ReactFiberHooksCurrent.hook.queue,
            next: null
        };

        if ( ReactFiberHooksCurrent.workInProgressHook === null ) {
            // This is the first hook in the list.
            ReactFiberHooksCurrent.renderingFiber.memoizedState = ReactFiberHooksCurrent.workInProgressHook = newHook;
        } else {
            // Append to the end of the list.
            ReactFiberHooksCurrent.workInProgressHook = ReactFiberHooksCurrent.workInProgressHook.next = newHook;
        }
    }

    return ReactFiberHooksCurrent.workInProgressHook;
}

export function areHookInputsEqual( nextDeps: DependencyList, prevDeps: DependencyList | null ): boolean {
    if ( __DEV__ ) {
        if ( ReactFiberHooksInfra.ignorePreviousDependencies ) {
            // Only true when this component is being hot reloaded.
            return false;
        }
    }

    if ( prevDeps === null ) {
        if ( __DEV__ ) {
            console.error( "%s received a final argument during this render, but not during " + "the previous render. Even though the final argument is optional, " + "its type cannot change between renders.", ReactFiberHooksCurrent.hookNameInDev );
        }

        return false;
    }

    if ( __DEV__ ) {
        // Don't bother comparing lengths in prod because these arrays should be
        // passed inline.
        if ( nextDeps.length !== prevDeps.length ) {
            console.error( "The final argument passed to %s changed size between renders. The " + "order and size of this array must remain constant.\n\n" + "Previous: %s\n" + "Incoming: %s", ReactFiberHooksCurrent.hookNameInDev, `[${ prevDeps.join( ", " ) }]`, `[${ nextDeps.join( ", " ) }]` );
        }
    }

    // $FlowFixMe[incompatible-use] found when upgrading Flow
    for ( let i = 0 ; i < prevDeps.length && i < nextDeps.length ; i++ ) {
        // $FlowFixMe[incompatible-use] found when upgrading Flow
        if ( is( nextDeps[ i ], prevDeps[ i ] ) ) {
            continue;
        }

        return false;
    }

    return true;
}

export function isRenderPhaseUpdate( fiber: Fiber ): boolean {
    const alternate = fiber.alternate;
    return fiber === ReactFiberHooksCurrent.renderingFiber || alternate !== null && alternate === ReactFiberHooksCurrent.renderingFiber;
}

export function enqueueRenderPhaseUpdate<S, A>( queue: HookUpdateQueue<S, A>, update: HookUpdate<S, A> ): void {
    // This is a render phase update. Stash it in a lazily-created map of
    // queue -> linked list of updates. After this render pass, we'll restart
    // and apply the stashed updates on top of the work-in-progress hook.
    ReactFiberHooksFlags.didScheduleRenderPhaseUpdateDuringThisPass = ReactFiberHooksFlags.didScheduleRenderPhaseUpdate = true;
    const pending = queue.pending;

    if ( pending === null ) {
        // This is the first update. Create a circular list.
        update.next = update;
    } else {
        update.next = pending.next;
        pending.next = update;
    }

    queue.pending = update;
}

export function markUpdateInDevTools<A>( fiber: Fiber, lane: Lane, action: A ): void {
    if ( __DEV__ ) {
        if ( enableDebugTracing ) {
            if ( fiber.mode & TypeOfMode.DebugTracingMode ) {
                const name = reactGetComponentNameFromFiber( fiber ) || "Unknown";
                logStateUpdateScheduled( name, lane, action );
            }
        }
    }

    if ( enableSchedulingProfiler ) {
        markStateUpdateScheduled( fiber, lane );
    }
}

export function getCallerStackFrame(): string {
    // not-used: eslint-disable-next-line react-internal/prod-error-codes
    const stackFrames = new Error( "Error message" ).stack?.split( "\n" );

    if ( ! stackFrames ) {
        throw new Error( "getCallerStackFrame failed to parse stack frame" );
    }

    // Some browsers (e.g. Chrome) include the error message in the stack
    // but others (e.g. Firefox) do not.
    if ( ReactFiberHooksInfra.stackContainsErrorMessage === null ) {
        ReactFiberHooksInfra.stackContainsErrorMessage = stackFrames[ 0 ].includes( "Error message" );
    }

    return ReactFiberHooksInfra.stackContainsErrorMessage ? stackFrames.slice( 3, 4 ).join( "\n" ) : stackFrames.slice( 2, 3 ).join( "\n" );
}
