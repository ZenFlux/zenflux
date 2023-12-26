import { enableSchedulingProfiler } from "@zenflux/react-shared/src/react-feature-flags";

import { get as getInstance } from "@zenflux/react-shared/src/react-instance-map";

import { WorkTag } from "@zenflux/react-shared/src/react-internal-constants/work-tags";

import {
    current as ReactCurrentFiberCurrent,
    isRendering as ReactCurrentFiberIsRendering
} from "@zenflux/react-reconciler/src/react-current-fiber";
import { createUpdate, enqueueUpdate, entangleTransitions } from "@zenflux/react-reconciler/src/react-fiber-class-update-queue";
import {
    emptyContextObject,
    findCurrentUnmaskedContext,
    isContextProvider as isLegacyContextProvider, processChildContext
} from "@zenflux/react-reconciler/src/react-fiber-context";
import { markRenderScheduled, onScheduleRoot } from "@zenflux/react-reconciler/src/react-fiber-dev-tools-hook";

import ReactFiberReconcilerSharedDev from "@zenflux/react-reconciler/src/react-fiber-reconciler-shared-dev";

import { createFiberRoot } from "@zenflux/react-reconciler/src/react-fiber-root";
import { requestUpdateLane } from "@zenflux/react-reconciler/src/react-fiber-work-in-progress-request-lane";
import { scheduleInitialHydrationOnRoot } from "@zenflux/react-reconciler/src/react-fiber-work-loop";
import { scheduleUpdateOnFiber } from "@zenflux/react-reconciler/src/react-fiber-work-schedule-update";
import reactGetComponentNameFromFiber from "@zenflux/react-reconciler/src/react-get-component-name-from-fiber";

import type { Container } from "@zenflux/react-reconciler/src/react-fiber-config";
import type { OpaqueRoot } from "@zenflux/react-reconciler/src/react-fiber-reconciler";

import type {
    Lane,
    SuspenseHydrationCallbacks,
    TransitionTracingCallbacks
} from "@zenflux/react-shared/src/react-internal-types";

import type { RootTag } from "@zenflux/react-shared/src/react-internal-constants/root-tags";

import type { Component } from "@zenflux/react-shared/src/component";
import type { ReactFormState, ReactNodeList } from "@zenflux/react-shared/src/react-types";

function getContextForSubtree( parentComponent: Component<any, any> | null | undefined ): Record<string, any> {
    if ( ! parentComponent ) {
        return emptyContextObject;
    }

    const fiber = getInstance( parentComponent );
    const parentContext = findCurrentUnmaskedContext( fiber );

    if ( fiber.tag === WorkTag.ClassComponent ) {
        const Component = fiber.type;

        if ( isLegacyContextProvider( Component ) ) {
            return processChildContext( fiber, Component, parentContext );
        }
    }

    return parentContext;
}

export function createContainer<TContainer = Container>(
    containerInfo: TContainer,
    tag: RootTag, hydrationCallbacks: null | SuspenseHydrationCallbacks,
    isStrictMode: boolean,
    concurrentUpdatesByDefaultOverride: null | boolean,
    identifierPrefix: string,
    onRecoverableError: ( error: Error ) => void,
    transitionCallbacks: null | TransitionTracingCallbacks
): OpaqueRoot {
    const hydrate = false;
    const initialChildren = null;

    return createFiberRoot(
        containerInfo,
        tag,
        hydrate,
        initialChildren,
        hydrationCallbacks,
        isStrictMode,
        concurrentUpdatesByDefaultOverride,
        identifierPrefix,
        onRecoverableError,
        transitionCallbacks,
        null
    );
}

export function createHydrationContainer(
    initialChildren: ReactNodeList, // TODO: Remove `callback` when we delete legacy mode.
    callback: ( ( ... args: Array<any> ) => any ) | null | undefined,
    containerInfo: Container,
    tag: RootTag,
    hydrationCallbacks: null | SuspenseHydrationCallbacks,
    isStrictMode: boolean,
    concurrentUpdatesByDefaultOverride: null | boolean,
    identifierPrefix: string,
    onRecoverableError: ( error: Error ) => void,
    transitionCallbacks: null | TransitionTracingCallbacks,
    formState: ReactFormState<any, any> | null ): OpaqueRoot {
    const hydrate = true;
    const root = createFiberRoot(
        containerInfo,
        tag, hydrate,
        initialChildren,
        hydrationCallbacks,
        isStrictMode,
        concurrentUpdatesByDefaultOverride,
        identifierPrefix,
        onRecoverableError,
        transitionCallbacks,
        formState
    );
    // TODO: Move this to FiberRoot constructor
    root.context = getContextForSubtree( null );
    // Schedule the initial render. In a hydration root, this is different from
    // a regular update because the initial render must match was was rendered
    // on the server.
    // NOTE: This update intentionally doesn't have a payload. We're only using
    // the update to schedule work on the root fiber (and, for legacy roots, to
    // enqueue the callback if one is provided).
    const current = root.current;
    const lane = requestUpdateLane( current );
    const update = createUpdate( lane );
    update.callback = callback !== undefined && callback !== null ? callback : null;
    enqueueUpdate( current, update, lane );
    scheduleInitialHydrationOnRoot( root, lane );
    return root;
}

export function updateContainer( element: ReactNodeList, container: OpaqueRoot, parentComponent: Component| null | undefined, callback: ( ( ... args: Array<any> ) => any ) | null | undefined ): Lane {
    if ( __DEV__ ) {
        onScheduleRoot( container, element );
    }

    const current = container.current;
    const lane = requestUpdateLane( current );

    if ( enableSchedulingProfiler ) {
        markRenderScheduled( lane );
    }

    const context = getContextForSubtree( parentComponent );

    if ( container.context === null ) {
        container.context = context;
    } else {
        container.pendingContext = context;
    }

    if ( __DEV__ ) {
        if ( ReactCurrentFiberIsRendering && ReactCurrentFiberCurrent !== null && ! ReactFiberReconcilerSharedDev.didWarnAboutNestedUpdates ) {
            ReactFiberReconcilerSharedDev.didWarnAboutNestedUpdates = true;
            console.error( "Render methods should be a pure function of props and state; " + "triggering nested component updates from render is not allowed. " + "If necessary, trigger nested updates in componentDidUpdate.\n\n" + "Check the render method of %s.", reactGetComponentNameFromFiber( ReactCurrentFiberCurrent ) || "Unknown" );
        }
    }

    const update = createUpdate( lane );
    // Caution: React DevTools currently depends on this property
    // being called "element".
    update.payload = {
        element
    };
    callback = callback === undefined ? null : callback;

    if ( callback !== null ) {
        if ( __DEV__ ) {
            if ( typeof callback !== "function" ) {
                console.error( "render(...): Expected the last optional `callback` argument to be a " + "function. Instead received: %s.", callback );
            }
        }

        update.callback = callback;
    }

    const root = enqueueUpdate( current, update, lane );

    if ( root !== null ) {
        scheduleUpdateOnFiber( root, current, lane );
        entangleTransitions( root, current, lane );
    }

    return lane;
}
