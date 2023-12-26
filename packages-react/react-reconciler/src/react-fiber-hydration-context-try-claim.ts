import { enableHostSingletons } from "@zenflux/react-shared/src/react-feature-flags";

import { FiberFlags } from "@zenflux/react-shared/src/react-internal-constants/fiber-flags";
import { WorkTag } from "@zenflux/react-shared/src/react-internal-constants/work-tags";
import { TypeOfMode } from "@zenflux/react-shared/src/react-internal-constants/type-of-mode";

import { getHostContext, getRootHostContainer } from "@zenflux/react-reconciler/src/react-fiber-host-context";
import { freeHydrating, isHydrating } from "@zenflux/react-reconciler/src/react-fiber-hydration-is-hydrating";

import { didSuspendOrErrorWhileHydratingDEV } from "@zenflux/react-reconciler/src/react-fiber-hydration-did-suspend-on-error";
import { getHydrationParentFiberSafe, setHydrationParentFiber } from "@zenflux/react-reconciler/src/react-fiber-hydration-context-parent";
import {
    getNextHydratableInstance,
    getNextHydratableInstanceSafe,
    setNextHydratableInstance
} from "@zenflux/react-reconciler/src/react-fiber-hydration-context-next-instance";
import {
    hasRootOrSingletonContextFlag,
    setRootOrSingletonContextFlag
} from "@zenflux/react-reconciler/src/react-fiber-hydration-context-root-or-singleton";
import { shouldClientRenderOnMismatch , throwOnHydrationMismatch } from "@zenflux/react-reconciler/src/react-fiber-hydration-context-mismatch";
import { tryHydrateInstance, tryHydrateSuspense, tryHydrateText } from "@zenflux/react-reconciler/src/react-fiber-hydration-context-try";
import { deleteHydratableInstance } from "@zenflux/react-reconciler/src/react-fiber-hydration-context";

import type { SuspenseState } from "@zenflux/react-reconciler/src/react-fiber-suspense-component";
import type { Fiber } from "@zenflux/react-shared/src/react-internal-types";

const {
    canHydrateFormStateMarker,
    didNotFindHydratableInstance,
    didNotFindHydratableInstanceWithinContainer,
    didNotFindHydratableInstanceWithinSuspenseInstance,
    didNotFindHydratableSuspenseInstance,
    didNotFindHydratableSuspenseInstanceWithinContainer,
    didNotFindHydratableSuspenseInstanceWithinSuspenseInstance,
    didNotFindHydratableTextInstance,
    didNotFindHydratableTextInstanceWithinContainer,
    didNotFindHydratableTextInstanceWithinSuspenseInstance,

    getFirstHydratableChild,
    getNextHydratableSibling,
    isFormStateMarkerMatching,
    isHydratableText,
    resolveSingletonInstance,
    supportsSingletons
} = globalThis.__RECONCILER__CONFIG__;

function warnNonHydratedInstance( returnFiber: Fiber, fiber: Fiber ) {
    if ( __DEV__ ) {
        if ( didSuspendOrErrorWhileHydratingDEV() ) {
            // Inside a boundary that already suspended. We're currently rendering the
            // siblings of a suspended node. The mismatch may be due to the missing
            // data, so it's probably a false positive.
            return;
        }

        switch ( returnFiber.tag ) {
            case WorkTag.HostRoot: {
                const parentContainer = returnFiber.stateNode.containerInfo;

                switch ( fiber.tag ) {
                    case WorkTag.HostSingleton:
                    case WorkTag.HostComponent:
                        const type = fiber.type;
                        const props = fiber.pendingProps;
                        didNotFindHydratableInstanceWithinContainer( parentContainer, type, props );
                        break;

                    case WorkTag.HostText:
                        const text = fiber.pendingProps;
                        didNotFindHydratableTextInstanceWithinContainer( parentContainer, text );
                        break;

                    case WorkTag.SuspenseComponent:
                        didNotFindHydratableSuspenseInstanceWithinContainer( parentContainer );
                        break;
                }

                break;
            }

            case WorkTag.HostSingleton:
            case WorkTag.HostComponent: {
                const parentType = returnFiber.type;
                const parentProps = returnFiber.memoizedProps;
                const parentInstance = returnFiber.stateNode;

                switch ( fiber.tag ) {
                    case WorkTag.HostSingleton:
                    case WorkTag.HostComponent: {
                        const type = fiber.type;
                        const props = fiber.pendingProps;
                        const isConcurrentMode = ( returnFiber.mode & TypeOfMode.ConcurrentMode ) !== TypeOfMode.NoMode;
                        didNotFindHydratableInstance( parentType, parentProps, parentInstance, type, props, // TODO: Delete this argument when we remove the legacy root API.
                            isConcurrentMode );
                        break;
                    }

                    case WorkTag.HostText: {
                        const text = fiber.pendingProps;
                        const isConcurrentMode = ( returnFiber.mode & TypeOfMode.ConcurrentMode ) !== TypeOfMode.NoMode;
                        didNotFindHydratableTextInstance( parentType, parentProps, parentInstance, text, // TODO: Delete this argument when we remove the legacy root API.
                            isConcurrentMode );
                        break;
                    }

                    case WorkTag.SuspenseComponent: {
                        didNotFindHydratableSuspenseInstance( parentType, parentProps, parentInstance );
                        break;
                    }
                }

                break;
            }

            case WorkTag.SuspenseComponent: {
                const suspenseState: SuspenseState = returnFiber.memoizedState;
                const parentInstance = suspenseState.dehydrated;
                if ( parentInstance !== null ) switch ( fiber.tag ) {
                    case WorkTag.HostSingleton:
                    case WorkTag.HostComponent:
                        const type = fiber.type;
                        const props = fiber.pendingProps;
                        didNotFindHydratableInstanceWithinSuspenseInstance( parentInstance, type, props );
                        break;

                    case WorkTag.HostText:
                        const text = fiber.pendingProps;
                        didNotFindHydratableTextInstanceWithinSuspenseInstance( parentInstance, text );
                        break;

                    case WorkTag.SuspenseComponent:
                        didNotFindHydratableSuspenseInstanceWithinSuspenseInstance( parentInstance );
                        break;
                }
                break;
            }

            default:
                return;
        }
    }
}

function insertNonHydratedInstance( returnFiber: Fiber, fiber: Fiber ) {
    fiber.flags = fiber.flags & ~FiberFlags.Hydrating | FiberFlags.Placement;
    warnNonHydratedInstance( returnFiber, fiber );
}

export function claimHydratableSingleton( fiber: Fiber ): void {
    if ( enableHostSingletons && supportsSingletons ) {
        if ( ! isHydrating() ) {
            return;
        }

        const currentRootContainer = getRootHostContainer();
        const currentHostContext = getHostContext();

        const instance = fiber.stateNode = resolveSingletonInstance(
            fiber.type,
            fiber.pendingProps,
            currentRootContainer,
            currentHostContext,
            false
        );

        setHydrationParentFiber( fiber );
        setRootOrSingletonContextFlag();
        setNextHydratableInstance( getFirstHydratableChild( instance ) );
    }
}

export function tryToClaimNextHydratableInstance( fiber: Fiber ): void {
    if ( ! isHydrating() ) {
        return;
    }

    const initialInstance = getNextHydratableInstance();
    const nextInstance = getNextHydratableInstance();

    if ( ! nextInstance ) {
        if ( shouldClientRenderOnMismatch( fiber ) ) {
            warnNonHydratedInstance( getHydrationParentFiberSafe(), fiber );
            throwOnHydrationMismatch( fiber );
        }

        // Nothing to hydrate. Make it an insertion.
        insertNonHydratedInstance( getHydrationParentFiberSafe(), fiber );

        freeHydrating();
        setHydrationParentFiber( fiber );
        setNextHydratableInstance( initialInstance );

        return;
    }

    if ( ! tryHydrateInstance( fiber, nextInstance ) ) {
        if ( shouldClientRenderOnMismatch( fiber ) ) {
            warnNonHydratedInstance( getHydrationParentFiberSafe(), fiber );
            throwOnHydrationMismatch( fiber );
        }

        // If we can't hydrate this instance let's try the next one.
        // We use this as a heuristic. It's based on intuition and not data so it
        // might be flawed or unnecessary.
        setNextHydratableInstance( getNextHydratableSibling( nextInstance ) );
        const prevHydrationParentFiber: Fiber = getHydrationParentFiberSafe();

        if ( ! getNextHydratableInstance() || ! tryHydrateInstance( fiber, getNextHydratableInstance() ) ) {
            // Nothing to hydrate. Make it an insertion.
            insertNonHydratedInstance( getHydrationParentFiberSafe(), fiber );
            freeHydrating();
            setHydrationParentFiber( fiber );
            setNextHydratableInstance( initialInstance );
            return;
        }

        // We matched the next one, we'll now assume that the first one was
        // superfluous and we'll delete it. Since we can't eagerly delete it
        // we'll have to schedule a deletion. To do that, this node needs a dummy
        // fiber associated with it.
        deleteHydratableInstance( prevHydrationParentFiber, nextInstance );
    }
}

export function tryToClaimNextHydratableTextInstance( fiber: Fiber ): void {
    if ( ! isHydrating() ) {
        return;
    }

    const text = fiber.pendingProps;
    const isHydratable = isHydratableText( text );
    const initialInstance = getNextHydratableInstance();
    const nextInstance = getNextHydratableInstance();

    if ( ! nextInstance || ! isHydratable ) {
        // We exclude non hydrabable text because we know there are no matching hydratables.
        // We either throw or insert depending on the render mode.
        if ( shouldClientRenderOnMismatch( fiber ) ) {
            warnNonHydratedInstance( getHydrationParentFiberSafe(), fiber );
            throwOnHydrationMismatch( fiber );
        }

        // Nothing to hydrate. Make it an insertion.
        insertNonHydratedInstance( getHydrationParentFiberSafe(), fiber );
        freeHydrating();
        setHydrationParentFiber( fiber );
        setNextHydratableInstance( initialInstance );
        return;
    }

    if ( ! tryHydrateText( fiber, nextInstance ) ) {
        if ( shouldClientRenderOnMismatch( fiber ) ) {
            warnNonHydratedInstance( getHydrationParentFiberSafe(), fiber );
            throwOnHydrationMismatch( fiber );
        }

        // If we can't hydrate this instance let's try the next one.
        // We use this as a heuristic. It's based on intuition and not data so it
        // might be flawed or unnecessary.
        setNextHydratableInstance( getNextHydratableSibling( nextInstance ) );
        const prevHydrationParentFiber: Fiber = getHydrationParentFiberSafe();

        if ( ! getNextHydratableInstance() || ! tryHydrateText( fiber, getNextHydratableInstance() ) ) {
            // Nothing to hydrate. Make it an insertion.
            insertNonHydratedInstance( getHydrationParentFiberSafe(), fiber );
            freeHydrating();
            setHydrationParentFiber( fiber );
            setNextHydratableInstance( initialInstance );
            return;
        }

        // We matched the next one, we'll now assume that the first one was
        // superfluous and we'll delete it. Since we can't eagerly delete it
        // we'll have to schedule a deletion. To do that, this node needs a dummy
        // fiber associated with it.
        deleteHydratableInstance( prevHydrationParentFiber, nextInstance );
    }
}

export function tryToClaimNextHydratableSuspenseInstance( fiber: Fiber ): void {
    if ( ! isHydrating() ) {
        return;
    }

    const initialInstance = getNextHydratableInstance();
    const nextInstance = getNextHydratableInstance();

    if ( ! nextInstance ) {
        if ( shouldClientRenderOnMismatch( fiber ) ) {
            warnNonHydratedInstance( getHydrationParentFiberSafe(), fiber );
            throwOnHydrationMismatch( fiber );
        }

        // Nothing to hydrate. Make it an insertion.
        insertNonHydratedInstance( getHydrationParentFiberSafe(), fiber );

        freeHydrating();

        setHydrationParentFiber( fiber );
        setNextHydratableInstance( initialInstance );
        return;
    }

    if ( ! tryHydrateSuspense( fiber, nextInstance ) ) {
        if ( shouldClientRenderOnMismatch( fiber ) ) {
            warnNonHydratedInstance( getHydrationParentFiberSafe(), fiber );
            throwOnHydrationMismatch( fiber );
        }

        // If we can't hydrate this instance let's try the next one.
        // We use this as a heuristic. It's based on intuition and not data so it
        // might be flawed or unnecessary.
        setNextHydratableInstance( getNextHydratableSibling( nextInstance ) );
        const prevHydrationParentFiber: Fiber = getHydrationParentFiberSafe();

        if ( ! getNextHydratableInstance() || ! tryHydrateSuspense( fiber, getNextHydratableInstance() ) ) {
            // Nothing to hydrate. Make it an insertion.
            insertNonHydratedInstance( getHydrationParentFiberSafe(), fiber );
            freeHydrating();
            setHydrationParentFiber( fiber );
            setNextHydratableInstance( initialInstance );
            return;
        }

        // We matched the next one, we'll now assume that the first one was
        // superfluous and we'll delete it. Since we can't eagerly delete it
        // we'll have to schedule a deletion. To do that, this node needs a dummy
        // fiber associated with it.
        deleteHydratableInstance( prevHydrationParentFiber, nextInstance );
    }
}

export function tryToClaimNextHydratableFormMarkerInstance( fiber: Fiber ): boolean {
    if ( ! isHydrating() ) {
        return false;
    }

    if ( getNextHydratableInstance() ) {
        const markerInstance = canHydrateFormStateMarker(
            getNextHydratableInstanceSafe(),
            hasRootOrSingletonContextFlag()
        );

        if ( markerInstance ) {
            // Found the marker instance.
            setNextHydratableInstance( getNextHydratableSibling( markerInstance ) );
            // Return true if this marker instance should use the state passed
            // to hydrateRoot.
            // TODO: As an optimization, Fizz should only emit these markers if form
            // state is passed at the root.
            return isFormStateMarkerMatching( markerInstance );
        }
    }

    // Should have found a marker instance. Throw an error to trigger client
    // rendering. We don't bother to check if we're in a concurrent root because
    // useFormState is a new API, so backwards compat is not an issue.
    throwOnHydrationMismatch( fiber );
    return false;
}
