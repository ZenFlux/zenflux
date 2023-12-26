import { OffscreenLane } from "@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants";

import { getSuspendedTreeContext } from "@zenflux/react-reconciler/src/react-fiber-tree-context";
import { createFiberFromDehydratedFragment } from "@zenflux/react-reconciler/src/react-fiber";
import { setHydrationParentFiber } from "@zenflux/react-reconciler/src/react-fiber-hydration-context-parent";
import {
    clearNextHydratableInstance,
    setNextHydratableInstance
} from "@zenflux/react-reconciler/src/react-fiber-hydration-context-next-instance";
import {
    clearRootOrSingletonContextFlag,
    hasRootOrSingletonContextFlag
} from "@zenflux/react-reconciler/src/react-fiber-hydration-context-root-or-singleton";

import type { Fiber } from "@zenflux/react-shared/src/react-internal-types";
import type { Instance, TextInstance } from "@zenflux/react-dom-bindings/src/client/ReactFiberConfigDOM";

const {
    canHydrateInstance,
    canHydrateSuspenseInstance,
    canHydrateTextInstance,
    getFirstHydratableChild,
} = globalThis.__RECONCILER__CONFIG__;

export function tryHydrateInstance( fiber: Fiber, nextInstance: any ) {
    // fiber is a HostComponent Fiber
    const instance = canHydrateInstance( nextInstance, fiber.type, fiber.pendingProps, hasRootOrSingletonContextFlag() );

    if ( instance !== null ) {
        fiber.stateNode = ( instance as Instance );

        setHydrationParentFiber( fiber );
        setNextHydratableInstance( getFirstHydratableChild( instance ) );
        clearRootOrSingletonContextFlag();

        return true;
    }

    return false;
}

export function tryHydrateText( fiber: Fiber, nextInstance: any ) {
    // fiber is a HostText Fiber
    const text = fiber.pendingProps;
    const textInstance = canHydrateTextInstance( nextInstance, text, hasRootOrSingletonContextFlag() );

    if ( textInstance !== null ) {
        fiber.stateNode = ( textInstance as TextInstance );

        setHydrationParentFiber( fiber );

        // Text Instances don't have children so there's nothing to hydrate.
        clearNextHydratableInstance();

        return true;
    }

    return false;
}

export function tryHydrateSuspense( fiber: Fiber, nextInstance: any ) {
    // fiber is a SuspenseComponent Fiber
    const suspenseInstance = canHydrateSuspenseInstance( nextInstance, hasRootOrSingletonContextFlag() );

    if ( suspenseInstance !== null ) {
        fiber.memoizedState = {
            dehydrated: suspenseInstance,
            treeContext: getSuspendedTreeContext(),
            retryLane: OffscreenLane
        };
        // Store the dehydrated fragment as a child fiber.
        // This simplifies the code for getHostSibling and deleting nodes,
        // since it doesn't have to consider all Suspense boundaries and
        // check if they're dehydrated ones or not.

        const dehydratedFragment = createFiberFromDehydratedFragment( suspenseInstance );
        dehydratedFragment.return = fiber;
        fiber.child = dehydratedFragment;

        setHydrationParentFiber( fiber );
        // While a Suspense Instance does have children, we won't step into
        // it during the first pass. Instead, we'll reenter it later.
        clearNextHydratableInstance();

        return true;
    }

    return false;
}
