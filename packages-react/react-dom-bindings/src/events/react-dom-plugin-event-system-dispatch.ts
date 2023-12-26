import {
    enableFloat,
    enableHostSingletons,
} from "@zenflux/react-shared/src/react-feature-flags";

import { WorkTag } from "@zenflux/react-shared/src/react-internal-constants/work-tags";

import { getClosestInstanceFromNode } from "@zenflux/react-dom-bindings/src/client/ReactDOMComponentTree";

import {
    IS_EVENT_HANDLE_NON_MANAGED_NODE,
    IS_NON_DELEGATED,
} from "@zenflux/react-dom-bindings/src/events/EventSystemFlags";
import { batchedUpdates } from "@zenflux/react-dom-bindings/src/events/ReactDOMUpdateBatching";

import { COMMENT_NODE } from "@zenflux/react-dom-bindings/src/client/HTMLNodeType";

import getEventTarget from "@zenflux/react-dom-bindings/src/events/getEventTarget";

import { extractEvents } from "@zenflux/react-dom-bindings/src/events/react-dom-plugin-event-system-dispatch-extract";

import { processDispatchQueue } from "@zenflux/react-dom-bindings/src/events/react-dom-plugin-event-system-process-dispatch";

import type {
    DispatchQueue
} from "@zenflux/react-dom-bindings/src/events/DOMPluginEventSystem";
import type { DOMEventName } from "@zenflux/react-dom-bindings/src/events/DOMEventNames";
import type { AnyNativeEvent } from "@zenflux/react-dom-bindings/src/events/PluginModuleType";
import type { EventSystemFlags} from "@zenflux/react-dom-bindings/src/events/EventSystemFlags";
import type { Fiber } from "@zenflux/react-shared/src/react-internal-types";

function isMatchingRootContainer( grandContainer: Element, targetContainer: EventTarget ): boolean {
    return grandContainer === targetContainer || grandContainer.nodeType === COMMENT_NODE && grandContainer.parentNode === targetContainer;
}

function dispatchEventsForPlugins( domEventName: DOMEventName, eventSystemFlags: EventSystemFlags, nativeEvent: AnyNativeEvent, targetInst: null | Fiber, targetContainer: EventTarget ): void {
    const nativeEventTarget = getEventTarget( nativeEvent );
    const dispatchQueue: DispatchQueue = [];
    extractEvents( dispatchQueue, domEventName, targetInst, nativeEvent, nativeEventTarget, eventSystemFlags, targetContainer );
    processDispatchQueue( dispatchQueue, eventSystemFlags );
}

export function dispatchEventForPluginEventSystem( domEventName: DOMEventName, eventSystemFlags: EventSystemFlags, nativeEvent: AnyNativeEvent, targetInst: null | Fiber, targetContainer: EventTarget ): void {
    let ancestorInst = targetInst;

    if ( ( eventSystemFlags & IS_EVENT_HANDLE_NON_MANAGED_NODE ) === 0 && ( eventSystemFlags & IS_NON_DELEGATED ) === 0 ) {
        const targetContainerNode = ( ( targetContainer as any ) as Node );

        if ( targetInst !== null ) {
            // The below logic attempts to work out if we need to change
            // the target fiber to a different ancestor. We had similar logic
            // in the legacy event system, except the big difference between
            // systems is that the modern event system now has an event listener
            // attached to each React Root and React Portal Root. Together,
            // the DOM nodes representing these roots are the "rootContainer".
            // To figure out which ancestor instance we should use, we traverse
            // up the fiber tree from the target instance and attempt to find
            // root boundaries that match that of our current "rootContainer".
            // If we find that "rootContainer", we find the parent fiber
            // sub-tree for that root and make that our ancestor instance.
            let node: null | Fiber = targetInst;

            mainLoop: while ( true ) {
                if ( node === null ) {
                    return;
                }

                const nodeTag = node.tag;

                if ( nodeTag === WorkTag.HostRoot || nodeTag === WorkTag.HostPortal ) {
                    let container = node.stateNode.containerInfo;

                    if ( isMatchingRootContainer( container, targetContainerNode ) ) {
                        break;
                    }

                    if ( nodeTag === WorkTag.HostPortal ) {
                        // The target is a portal, but it's not the rootContainer we're looking for.
                        // Normally portals handle their own events all the way down to the root.
                        // So we should be able to stop now. However, we don't know if this portal
                        // was part of *our* root.
                        let grandNode = node.return;

                        while ( grandNode !== null ) {
                            const grandTag = grandNode.tag;

                            if ( grandTag === WorkTag.HostRoot || grandTag === WorkTag.HostPortal ) {
                                const grandContainer = grandNode.stateNode.containerInfo;

                                if ( isMatchingRootContainer( grandContainer, targetContainerNode ) ) {
                                    // This is the rootContainer we're looking for and we found it as
                                    // a parent of the Portal. That means we can ignore it because the
                                    // Portal will bubble through to us.
                                    return;
                                }
                            }

                            grandNode = grandNode.return;
                        }
                    }

                    // Now we need to find it's corresponding host fiber in the other
                    // tree. To do this we can use getClosestInstanceFromNode, but we
                    // need to validate that the fiber is a host instance, otherwise
                    // we need to traverse up through the DOM till we find the correct
                    // node that is from the other tree.
                    while ( container !== null ) {
                        const parentNode = getClosestInstanceFromNode( container );

                        if ( parentNode === null ) {
                            return;
                        }

                        const parentTag = parentNode.tag;

                        if ( parentTag === WorkTag.HostComponent || parentTag === WorkTag.HostText || ( enableFloat ? parentTag === WorkTag.HostHoistable : false ) || ( enableHostSingletons ? parentTag === WorkTag.HostSingleton : false ) ) {
                            node = ancestorInst = parentNode;
                            continue mainLoop;
                        }

                        container = container.parentNode;
                    }
                }

                node = node.return;
            }
        }
    }

    batchedUpdates( () => dispatchEventsForPlugins( domEventName, eventSystemFlags, nativeEvent, ancestorInst, targetContainer ) );
}
