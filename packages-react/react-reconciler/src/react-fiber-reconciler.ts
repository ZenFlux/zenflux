import { get as getInstance } from "@zenflux/react-shared/src/react-instance-map";

import ReactSharedInternals from "@zenflux/react-shared/src/react-shared-internals";

import ReactVersion from "@zenflux/react-shared/src/react-version";

import {
    SelectiveHydrationLane,
    SyncLane
} from "@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants";

import { WorkTag } from "@zenflux/react-shared/src/react-internal-constants/work-tags";

import { TypeOfMode } from "@zenflux/react-shared/src/react-internal-constants/type-of-mode";

import {
    current as ReactCurrentFiberCurrent,
    resetCurrentFiber as resetCurrentDebugFiberInDEV,
    setCurrentFiber as setCurrentDebugFiberInDEV
} from "@zenflux/react-reconciler/src/react-current-fiber";
import { getCurrentUpdatePriority, runWithPriority } from "@zenflux/react-reconciler/src/react-event-priorities";
import { enqueueConcurrentRenderForLane } from "@zenflux/react-reconciler/src/react-fiber-concurrent-updates";
import { injectInternals } from "@zenflux/react-reconciler/src/react-fiber-dev-tools-hook";
import {
    findHostInstancesForRefresh,
    scheduleRefresh,
    scheduleRoot,
} from "@zenflux/react-reconciler/src/react-fiber-hot-reloading";
import { setRefreshHandler } from "@zenflux/react-reconciler/src/react-fiber-hot-reloading-resvole";
import { getHighestPriorityPendingLanes, higherPriorityLane } from "@zenflux/react-reconciler/src/react-fiber-lane";

import ReactFiberReconcilerSharedDev from "@zenflux/react-reconciler/src/react-fiber-reconciler-shared-dev";

import { isRootDehydrated } from "@zenflux/react-reconciler/src/react-fiber-shell-hydration";
import {
    findCurrentHostFiber,
    findCurrentHostFiberWithNoPortals
} from "@zenflux/react-reconciler/src/react-fiber-tree-reflection";
import { flushSync } from "@zenflux/react-reconciler/src/react-fiber-work-flush-sync";
import { requestUpdateLane } from "@zenflux/react-reconciler/src/react-fiber-work-in-progress-request-lane";

import {
    batchedUpdates,
    deferredUpdates,
    discreteUpdates,
    flushRoot,
    isAlreadyRendering,
} from "@zenflux/react-reconciler/src/react-fiber-work-loop";
import { flushPassiveEffects } from "@zenflux/react-reconciler/src/react-fiber-work-passive-effects";
import { scheduleUpdateOnFiber } from "@zenflux/react-reconciler/src/react-fiber-work-schedule-update";
import reactGetComponentNameFromFiber from "@zenflux/react-reconciler/src/react-get-component-name-from-fiber";

import { setShouldError } from "@zenflux/react-reconciler/src/react-fiber-should-error";
import { setShouldSuspend } from "@zenflux/react-reconciler/src/react-fiber-should-suspend";

import type {
    Instance,
    PublicInstance,
    RendererInspectionConfig,
    TextInstance
} from "@zenflux/react-reconciler/src/react-fiber-config";
import type { SuspenseState } from "@zenflux/react-reconciler/src/react-fiber-suspense-component";
import type { Fiber, FiberRoot, Lane } from "@zenflux/react-shared/src/react-internal-types";
import type { Component } from "@zenflux/react-shared/src/component";
import type React from "react";

// --- Problematic callbacks find better solution
// eslint-disable-next-line import/order
import "@zenflux/react-reconciler/src/react-fiber-work-on-root";
// eslint-disable-next-line import/order
import "@zenflux/react-reconciler/src/react-fiber-work-on-root-schedule";
// eslint-disable-next-line import/order
import "@zenflux/react-reconciler/src/react-fiber-work-double-invoke-effects-in-dev";
// ---

export {
    createComponentSelector,
    createHasPseudoClassSelector,
    createRoleSelector,
    createTestNameSelector,
    createTextSelector,
    getFindAllNodesFailureDescription,
    findAllNodes,
    findBoundingRects,
    focusWithin,
    observeVisibleRects
} from "@zenflux/react-reconciler/src/react-test-selectors";

export { startHostTransition } from "@zenflux/react-reconciler/src/react-fiber-hooks";

export { shouldError } from "@zenflux/react-reconciler/src/react-fiber-should-error";
export { shouldSuspend } from "@zenflux/react-reconciler/src/react-fiber-should-suspend";

export { createContainer, createHydrationContainer, updateContainer } from "@zenflux/react-reconciler/src/react-fiber-reconciler-contianer";

export { createPortal } from "@zenflux/react-reconciler/src/react-portal";

export type OpaqueRoot = FiberRoot;

// 0 is PROD, 1 is DEV.
// Might add PROFILE later.
export type BundleType = 0 | 1;

export type DevToolsConfig<TInstance extends Instance, TTextInstance extends TextInstance, TRendererInspectionConfig extends RendererInspectionConfig = RendererInspectionConfig> = {
    bundleType: BundleType;
    version: string;
    rendererPackageName: string;
    // Note: this actually *does* depend on Fiber internal fields.
    // Used by "inspect clicked DOM element" in React DevTools.
    findFiberByHostInstance?: ( instance: TInstance | TTextInstance ) => Fiber | null;
    rendererConfig?: TRendererInspectionConfig;
};

const {
    getPublicInstance
} = globalThis.__RECONCILER__CONFIG__;

if ( __DEV__ ) {
    ReactFiberReconcilerSharedDev.didWarnAboutNestedUpdates = false;
    ReactFiberReconcilerSharedDev.didWarnAboutFindNodeInStrictMode = ( {} as Record<string, boolean> );
}

function findHostInstance<TPublicInstance extends PublicInstance>( component: Component ): TPublicInstance | null {
    const fiber = getInstance( component );

    if ( fiber === undefined ) {
        if ( typeof component.render === "function" ) {
            throw new Error( "Unable to find node on an unmounted component." );
        } else {
            const keys = Object.keys( component ).join( "," );
            throw new Error( `Argument appears to not be a ReactComponent. Keys: ${ keys }` );
        }
    }

    const hostFiber = findCurrentHostFiber( fiber );

    if ( hostFiber === null ) {
        return null;
    }

    return getPublicInstance( hostFiber.stateNode );
}

function findHostInstanceWithWarning<TPublicInstance extends PublicInstance>( component: Component, methodName: string ): TPublicInstance | null {
    if ( __DEV__ ) {
        const fiber = getInstance( component );

        if ( fiber === undefined ) {
            if ( typeof component.render === "function" ) {
                throw new Error( "Unable to find node on an unmounted component." );
            } else {
                const keys = Object.keys( component ).join( "," );
                throw new Error( `Argument appears to not be a ReactComponent. Keys: ${ keys }` );
            }
        }

        const hostFiber = findCurrentHostFiber( fiber );

        if ( hostFiber === null ) {
            return null;
        }

        if ( hostFiber.mode & TypeOfMode.StrictLegacyMode ) {
            const componentName = reactGetComponentNameFromFiber( fiber ) || "Component";

            if ( ! ReactFiberReconcilerSharedDev.didWarnAboutFindNodeInStrictMode[ componentName ] ) {
                ReactFiberReconcilerSharedDev.didWarnAboutFindNodeInStrictMode[ componentName ] = true;
                const previousFiber = ReactCurrentFiberCurrent;

                try {
                    setCurrentDebugFiberInDEV( hostFiber );

                    if ( fiber.mode & TypeOfMode.StrictLegacyMode ) {
                        console.error( "%s is deprecated in StrictMode. " + "%s was passed an instance of %s which is inside StrictMode. " + "Instead, add a ref directly to the element you want to reference. " + "Learn more about using refs safely here: " + "https://reactjs.org/link/strict-mode-find-node", methodName, methodName, componentName );
                    } else {
                        console.error( "%s is deprecated in StrictMode. " + "%s was passed an instance of %s which renders StrictMode children. " + "Instead, add a ref directly to the element you want to reference. " + "Learn more about using refs safely here: " + "https://reactjs.org/link/strict-mode-find-node", methodName, methodName, componentName );
                    }
                } finally {
                    // Ideally this should reset to previous but this shouldn't be called in
                    // render and there's another warning for that anyway.
                    if ( previousFiber ) {
                        setCurrentDebugFiberInDEV( previousFiber );
                    } else {
                        resetCurrentDebugFiberInDEV();
                    }
                }
            }
        }

        return getPublicInstance( hostFiber.stateNode );
    }

    return findHostInstance( component );
}

export { batchedUpdates, deferredUpdates, discreteUpdates, flushSync, isAlreadyRendering, flushPassiveEffects };

export function getPublicRootInstance<TPublicInstance extends PublicInstance>( container: OpaqueRoot ): React.Component<any, any> | TPublicInstance | null {
    const containerFiber = container.current;

    if ( ! containerFiber.child ) {
        return null;
    }

    switch ( containerFiber.child.tag ) {
        case WorkTag.HostSingleton:
        case WorkTag.HostComponent:
            return getPublicInstance( containerFiber.child.stateNode );

        default:
            return containerFiber.child.stateNode;
    }
}

export function attemptSynchronousHydration( fiber: Fiber ): void {
    switch ( fiber.tag ) {
        case WorkTag.HostRoot: {
            const root: FiberRoot = fiber.stateNode;

            if ( isRootDehydrated( root ) ) {
                // Flush the first scheduled "update".
                const lanes = getHighestPriorityPendingLanes( root );
                flushRoot( root, lanes );
            }

            break;
        }

        case WorkTag.SuspenseComponent: {
            flushSync( () => {
                const root = enqueueConcurrentRenderForLane( fiber, SyncLane );

                if ( root !== null ) {
                    scheduleUpdateOnFiber( root, fiber, SyncLane );
                }
            } );
            // If we're still blocked after this, we need to increase
            // the priority of any promises resolving within this
            // boundary so that they next attempt also has higher pri.
            const retryLane = SyncLane;
            markRetryLaneIfNotHydrated( fiber, retryLane );
            break;
        }
    }
}

function markRetryLaneImpl( fiber: Fiber, retryLane: Lane ) {
    const suspenseState: null | SuspenseState = fiber.memoizedState;

    if ( suspenseState !== null && suspenseState.dehydrated !== null ) {
        suspenseState.retryLane = higherPriorityLane( suspenseState.retryLane, retryLane );
    }
}

// Increases the priority of thenables when they resolve within this boundary.
function markRetryLaneIfNotHydrated( fiber: Fiber, retryLane: Lane ) {
    markRetryLaneImpl( fiber, retryLane );
    const alternate = fiber.alternate;

    if ( alternate ) {
        markRetryLaneImpl( alternate, retryLane );
    }
}

// This is method comes from binary
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function attemptDiscreteHydration( fiber: Fiber ) {
    throw new Error( "Not yet implemented." );
    // if ( fiber.tag !== WorkTag.SuspenseComponent ) {
    //     // We ignore HostRoots here because we can't increase
    //     // their priority and they should not suspend on I/O,
    //     // since you have to wrap anything that might suspend in
    //     // Suspense.
    //     return;
    // }
    //
    // const lane = SyncLane;
    // const root = enqueueConcurrentRenderForLane( fiber, lane );
    //
    // if ( root !== null ) {
    //     var eventTime = requestEventTime();
    //     scheduleUpdateOnFiber( root, fiber, lane, eventTime );
    // }
    //
    // markRetryLaneIfNotHydrated( fiber, lane );
}

export function attemptContinuousHydration( fiber: Fiber ): void {
    if ( fiber.tag !== WorkTag.SuspenseComponent ) {
        // We ignore HostRoots here because we can't increase
        // their priority and they should not suspend on I/O,
        // since you have to wrap anything that might suspend in
        // Suspense.
        return;
    }

    const lane = SelectiveHydrationLane;
    const root = enqueueConcurrentRenderForLane( fiber, lane );

    if ( root !== null ) {
        scheduleUpdateOnFiber( root, fiber, lane );
    }

    markRetryLaneIfNotHydrated( fiber, lane );
}

export function attemptHydrationAtCurrentPriority( fiber: Fiber ): void {
    if ( fiber.tag !== WorkTag.SuspenseComponent ) {
        // We ignore HostRoots here because we can't increase
        // their priority other than synchronously flush it.
        return;
    }

    const lane = requestUpdateLane( fiber );
    const root = enqueueConcurrentRenderForLane( fiber, lane );

    if ( root !== null ) {
        scheduleUpdateOnFiber( root, fiber, lane );
    }

    markRetryLaneIfNotHydrated( fiber, lane );
}

export { getCurrentUpdatePriority, runWithPriority };
export { findHostInstance };
export { findHostInstanceWithWarning };

export function findHostInstanceWithNoPortals<TPublicInstance extends PublicInstance>( fiber: Fiber ): TPublicInstance | null {
    const hostFiber = findCurrentHostFiberWithNoPortals( fiber );

    if ( hostFiber === null ) {
        return null;
    }

    return getPublicInstance( hostFiber.stateNode );
}

let overrideHookState: ( ( fiber: Fiber, id: number, path: ( string | number )[], value: any ) => void ) | null = null;
let overrideHookStateDeletePath: ( ( fiber: Fiber, id: number, path: ( string | number )[] ) => void ) | null = null;
let overrideHookStateRenamePath: ( ( fiber: Fiber, id: number, oldPath: ( string | number )[], newPath: ( string | number )[] ) => void ) | null = null;
let overrideProps: ( ( fiber: Fiber, path: ( string | number )[], value: any ) => void ) | null = null;
let overridePropsDeletePath: ( ( fiber: Fiber, path: ( string | number )[] ) => void ) | null = null;
let overridePropsRenamePath: ( ( fiber: Fiber, oldPath: ( string | number )[], newPath: ( string | number )[] ) => void ) | null = null;
let scheduleUpdate: ( ( fiber: Fiber ) => void ) | null = null;

if ( __DEV__ ) {
    const copyWithDeleteImpl = ( obj: any, path: Array<string | number>, index: number ): any => {
        const key = path[ index ];
        const updated = Array.isArray( obj ) ? obj.slice() : {
            ... obj
        };

        if ( index + 1 === path.length ) {
            if ( Array.isArray( updated ) ) {
                updated.splice( ( ( key as any ) as number ), 1 );
            } else {
                delete updated[ key ];
            }

            return updated;
        }

        // $FlowFixMe[incompatible-use] number or string is fine here
        updated[ key ] = copyWithDeleteImpl( obj[ key ], path, index + 1 );
        return updated;
    };

    const copyWithDelete = ( obj: Record<string, any> | Array<any>, path: Array<string | number> ): Record<string, any> | Array<any> => {
        return copyWithDeleteImpl( obj, path, 0 );
    };

    const copyWithRenameImpl = ( obj: any, oldPath: Array<string | number>, newPath: Array<string | number>, index: number ): any => {
        const oldKey = oldPath[ index ];
        const updated = Array.isArray( obj ) ? obj.slice() : {
            ... obj
        };

        if ( index + 1 === oldPath.length ) {
            const newKey = newPath[ index ];
            // $FlowFixMe[incompatible-use] number or string is fine here
            updated[ newKey ] = updated[ oldKey ];

            if ( Array.isArray( updated ) ) {
                updated.splice( ( ( oldKey as any ) as number ), 1 );
            } else {
                delete updated[ oldKey ];
            }
        } else {
            // $FlowFixMe[incompatible-use] number or string is fine here
            updated[ oldKey ] = copyWithRenameImpl( // $FlowFixMe[incompatible-use] number or string is fine here
                obj[ oldKey ], oldPath, newPath, index + 1 );
        }

        return updated;
    };

    const copyWithRename = ( obj: Record<string, any> | Array<any>, oldPath: Array<string | number>, newPath: Array<string | number> ): Record<string, any> | Array<any> | undefined => {
        if ( oldPath.length !== newPath.length ) {
            console.warn( "copyWithRename() expects paths of the same length" );
            return;
        } else {
            for ( let i = 0 ; i < newPath.length - 1 ; i++ ) {
                if ( oldPath[ i ] !== newPath[ i ] ) {
                    console.warn( "copyWithRename() expects paths to be the same except for the deepest key" );
                    return;
                }
            }
        }

        return copyWithRenameImpl( obj, oldPath, newPath, 0 );
    };

    const copyWithSetImpl = ( obj: any, path: Array<string | number>, index: number, value: any ): any => {
        if ( index >= path.length ) {
            return value;
        }

        const key = path[ index ];
        const updated = Array.isArray( obj ) ? obj.slice() : {
            ... obj
        };
        // $FlowFixMe[incompatible-use] number or string is fine here
        updated[ key ] = copyWithSetImpl( obj[ key ], path, index + 1, value );
        return updated;
    };

    const copyWithSet = ( obj: Record<string, any> | Array<any>, path: Array<string | number>, value: any ): Record<string, any> | Array<any> => {
        return copyWithSetImpl( obj, path, 0, value );
    };

    const findHook = ( fiber: Fiber, id: number ) => {
        // For now, the "id" of stateful hooks is just the stateful hook index.
        // This may change in the future with e.g. nested hooks.
        let currentHook = fiber.memoizedState;

        while ( currentHook !== null && id > 0 ) {
            currentHook = currentHook.next;
            id--;
        }

        return currentHook;
    };

    // Support DevTools editable values for useState and useReducer.
    overrideHookState = ( fiber: Fiber, id: number, path: Array<string | number>, value: any ) => {
        const hook = findHook( fiber, id );

        if ( hook !== null ) {
            const newState = copyWithSet( hook.memoizedState, path, value );
            hook.memoizedState = newState;
            hook.baseState = newState;
            // We aren't actually adding an update to the queue,
            // because there is no update we can add for useReducer hooks that won't trigger an error.
            // (There's no appropriate action type for DevTools overrides.)
            // As a result though, React will see the scheduled update as a noop and bailout.
            // Shallow cloning props works as a workaround for now to bypass the bailout check.
            fiber.memoizedProps = {
                ... fiber.memoizedProps
            };
            const root = enqueueConcurrentRenderForLane( fiber, SyncLane );

            if ( root !== null ) {
                scheduleUpdateOnFiber( root, fiber, SyncLane );
            }
        }
    };

    overrideHookStateDeletePath = ( fiber: Fiber, id: number, path: Array<string | number> ) => {
        const hook = findHook( fiber, id );

        if ( hook !== null ) {
            const newState = copyWithDelete( hook.memoizedState, path );
            hook.memoizedState = newState;
            hook.baseState = newState;
            // We aren't actually adding an update to the queue,
            // because there is no update we can add for useReducer hooks that won't trigger an error.
            // (There's no appropriate action type for DevTools overrides.)
            // As a result though, React will see the scheduled update as a noop and bailout.
            // Shallow cloning props works as a workaround for now to bypass the bailout check.
            fiber.memoizedProps = {
                ... fiber.memoizedProps
            };
            const root = enqueueConcurrentRenderForLane( fiber, SyncLane );

            if ( root !== null ) {
                scheduleUpdateOnFiber( root, fiber, SyncLane );
            }
        }
    };

    overrideHookStateRenamePath = ( fiber: Fiber, id: number, oldPath: Array<string | number>, newPath: Array<string | number> ) => {
        const hook = findHook( fiber, id );

        if ( hook !== null ) {
            const newState = copyWithRename( hook.memoizedState, oldPath, newPath );
            hook.memoizedState = newState;
            hook.baseState = newState;
            // We aren't actually adding an update to the queue,
            // because there is no update we can add for useReducer hooks that won't trigger an error.
            // (There's no appropriate action type for DevTools overrides.)
            // As a result though, React will see the scheduled update as a noop and bailout.
            // Shallow cloning props works as a workaround for now to bypass the bailout check.
            fiber.memoizedProps = {
                ... fiber.memoizedProps
            };
            const root = enqueueConcurrentRenderForLane( fiber, SyncLane );

            if ( root !== null ) {
                scheduleUpdateOnFiber( root, fiber, SyncLane );
            }
        }
    };

    // Support DevTools props for function components, forwardRef, memo, host components, etc.
    overrideProps = ( fiber: Fiber, path: Array<string | number>, value: any ) => {
        fiber.pendingProps = copyWithSet( fiber.memoizedProps, path, value );

        if ( fiber.alternate ) {
            fiber.alternate.pendingProps = fiber.pendingProps;
        }

        const root = enqueueConcurrentRenderForLane( fiber, SyncLane );

        if ( root !== null ) {
            scheduleUpdateOnFiber( root, fiber, SyncLane );
        }
    };

    overridePropsDeletePath = ( fiber: Fiber, path: Array<string | number> ) => {
        fiber.pendingProps = copyWithDelete( fiber.memoizedProps, path );

        if ( fiber.alternate ) {
            fiber.alternate.pendingProps = fiber.pendingProps;
        }

        const root = enqueueConcurrentRenderForLane( fiber, SyncLane );

        if ( root !== null ) {
            scheduleUpdateOnFiber( root, fiber, SyncLane );
        }
    };

    overridePropsRenamePath = ( fiber: Fiber, oldPath: Array<string | number>, newPath: Array<string | number> ) => {
        fiber.pendingProps = copyWithRename( fiber.memoizedProps, oldPath, newPath );

        if ( fiber.alternate ) {
            fiber.alternate.pendingProps = fiber.pendingProps;
        }

        const root = enqueueConcurrentRenderForLane( fiber, SyncLane );

        if ( root !== null ) {
            scheduleUpdateOnFiber( root, fiber, SyncLane );
        }
    };

    scheduleUpdate = ( fiber: Fiber ) => {
        const root = enqueueConcurrentRenderForLane( fiber, SyncLane );

        if ( root !== null ) {
            scheduleUpdateOnFiber( root, fiber, SyncLane );
        }
    };
}

function findHostInstanceByFiber( fiber: Fiber ): Instance | TextInstance | null {
    const hostFiber = findCurrentHostFiber( fiber );

    if ( hostFiber === null ) {
        return null;
    }

    return hostFiber.stateNode;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function emptyFindFiberByHostInstance( instance: Instance | TextInstance ): Fiber | null {
    return null;
}

function getCurrentFiberForDevTools() {
    return ReactCurrentFiberCurrent;
}

export function injectIntoDevTools<
    TInstance extends Instance = Instance,
    TTextInstance extends TextInstance = TextInstance,
    TRendererInspectionConfig extends RendererInspectionConfig = RendererInspectionConfig
>( devToolsConfig: DevToolsConfig<TInstance, TTextInstance, TRendererInspectionConfig> ): boolean {
    const {
        findFiberByHostInstance
    } = devToolsConfig;
    const {
        ReactCurrentDispatcher
    } = ReactSharedInternals;
    return injectInternals( {
        bundleType: devToolsConfig.bundleType,
        version: devToolsConfig.version,
        rendererPackageName: devToolsConfig.rendererPackageName,
        rendererConfig: devToolsConfig.rendererConfig,
        overrideHookState,
        overrideHookStateDeletePath,
        overrideHookStateRenamePath,
        overrideProps,
        overridePropsDeletePath,
        overridePropsRenamePath,
        setErrorHandler: setShouldError,
        setSuspenseHandler: setShouldSuspend,
        scheduleUpdate,
        currentDispatcherRef: ReactCurrentDispatcher,
        findHostInstanceByFiber,
        findFiberByHostInstance: findFiberByHostInstance || emptyFindFiberByHostInstance,
        // React Refresh
        findHostInstancesForRefresh: __DEV__ ? findHostInstancesForRefresh : null,
        scheduleRefresh: __DEV__ ? scheduleRefresh : null,
        scheduleRoot: __DEV__ ? scheduleRoot : null,
        setRefreshHandler: __DEV__ ? setRefreshHandler : null,
        // Enables DevTools to append owner stacks to error messages in DEV mode.
        getCurrentFiber: __DEV__ ? getCurrentFiberForDevTools : null,
        // Enables DevTools to detect reconciler version rather than renderer version
        // which may not match for third party renderers.
        reconcilerVersion: ReactVersion
    } );
}
