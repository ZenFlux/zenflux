import {
    getContainerFromFiber,
    getNearestMountedFiber,
    getSuspenseInstanceFromFiber
} from "@zenflux/react-reconciler/src/react-fiber-tree-reflection";

import { WorkTag } from "@zenflux/react-shared/src/react-internal-constants/work-tags";

import { isRootDehydrated } from "@zenflux/react-reconciler/src/react-fiber-shell-hydration";

import { getClosestInstanceFromNode } from "@zenflux/react-dom-bindings/src/client/ReactDOMComponentTree";

import getEventTarget from "@zenflux/react-dom-bindings/src/events/getEventTarget";

import type { AnyNativeEvent } from "@zenflux/react-dom-bindings/src/events/PluginModuleType";
import type { Container } from "@zenflux/react-dom-bindings/src/client/ReactFiberConfigDOM";
import type { SuspenseInstance } from "@zenflux/react-shared/src/react-internal-types/suspense";
import type { Fiber, FiberRoot } from "@zenflux/react-shared/src/react-internal-types";

export function findInstanceBlockingEvent( nativeEvent: AnyNativeEvent ): null | Container | SuspenseInstance {
    const nativeEventTarget = getEventTarget( nativeEvent );
    return findInstanceBlockingTarget( nativeEventTarget );
}

export let return_targetInst: null | Fiber = null;
// Returns a SuspenseInstance or Container if it's blocked.
// The return_targetInst field above is conceptually part of the return value.
export function findInstanceBlockingTarget( targetNode: Node ): null | Container | SuspenseInstance {
    // TODO: Warn if _enabled is false.
    return_targetInst = null;
    let targetInst = getClosestInstanceFromNode( targetNode );

    if ( targetInst !== null ) {
        const nearestMounted = getNearestMountedFiber( targetInst );

        if ( nearestMounted === null ) {
            // This tree has been unmounted already. Dispatch without a target.
            targetInst = null;
        } else {
            const tag = nearestMounted.tag;

            if ( tag === WorkTag.SuspenseComponent ) {
                const instance = getSuspenseInstanceFromFiber( nearestMounted );

                if ( instance !== null ) {
                    // Queue the event to be replayed later. Abort dispatching since we
                    // don't want this event dispatched twice through the event system.
                    // TODO: If this is the first discrete event in the queue. Schedule an increased
                    // priority for this boundary.
                    return instance;
                }

                // This shouldn't happen, something went wrong but to avoid blocking
                // the whole system, dispatch the event without a target.
                // TODO: Warn.
                targetInst = null;
            } else if ( tag === WorkTag.HostRoot ) {
                const root: FiberRoot = nearestMounted.stateNode;

                if ( isRootDehydrated( root ) ) {
                    // If this happens during a replay something went wrong and it might block
                    // the whole system.
                    return getContainerFromFiber( nearestMounted );
                }

                targetInst = null;
            } else if ( nearestMounted !== targetInst ) {
                // If we get an event (ex: img onload) before committing that
                // component's mount, ignore it for now (that is, treat it as if it was an
                // event on a non-React tree). We might also consider queueing events and
                // dispatching them after the mount.
                targetInst = null;
            }
        }
    }

    return_targetInst = targetInst;
    // We're not blocked on anything.
    return null;
}
