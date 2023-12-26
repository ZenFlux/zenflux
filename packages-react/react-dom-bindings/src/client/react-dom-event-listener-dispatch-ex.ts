import { attemptSynchronousHydration } from "@zenflux/react-reconciler/src/react-fiber-reconciler";

import { IS_CAPTURE_PHASE } from "@zenflux/react-dom-bindings/src/events/EventSystemFlags";

import { findInstanceBlockingEvent, return_targetInst } from "@zenflux/react-dom-bindings/src/events/react-dom-event-listener-find";
import { dispatchEventForPluginEventSystem } from "@zenflux/react-dom-bindings/src/events/react-dom-plugin-event-system-dispatch";
import {
    clearIfContinuousEvent,
    isDiscreteEventThatRequiresHydration,
    queueIfContinuousEvent
} from "@zenflux/react-dom-bindings/src/events/ReactDOMEventReplaying";

import { isEnabled } from "@zenflux/react-dom-bindings/src/client/react-dom-event-listener-dispatch-switch";

import { getInstanceFromNode } from "@zenflux/react-dom-bindings/src/client/ReactDOMComponentTree";

import type { AnyNativeEvent } from "@zenflux/react-dom-bindings/src/events/PluginModuleType";
import type { DOMEventName } from "@zenflux/react-dom-bindings/src/events/DOMEventNames";

import type { EventSystemFlags} from "@zenflux/react-dom-bindings/src/events/EventSystemFlags";

export function dispatchEventEx( domEventName: DOMEventName, eventSystemFlags: EventSystemFlags, targetContainer: EventTarget, nativeEvent: AnyNativeEvent ): void {
    if ( ! isEnabled() ) {
        return;
    }

    let blockedOn = findInstanceBlockingEvent( nativeEvent );

    if ( blockedOn === null ) {
        dispatchEventForPluginEventSystem( domEventName, eventSystemFlags, nativeEvent, return_targetInst, targetContainer );
        clearIfContinuousEvent( domEventName, nativeEvent );
        return;
    }

    if ( queueIfContinuousEvent( blockedOn, domEventName, eventSystemFlags, targetContainer, nativeEvent ) ) {
        nativeEvent.stopPropagation();
        return;
    }

    // We need to clear only if we didn't queue because
    // queueing is accumulative.
    clearIfContinuousEvent( domEventName, nativeEvent );

    if ( eventSystemFlags & IS_CAPTURE_PHASE && isDiscreteEventThatRequiresHydration( domEventName ) ) {
        while ( blockedOn !== null ) {
            const fiber = getInstanceFromNode( blockedOn );

            if ( fiber !== null ) {
                attemptSynchronousHydration( fiber );
            }

            const nextBlockedOn = findInstanceBlockingEvent( nativeEvent );

            if ( nextBlockedOn === null ) {
                dispatchEventForPluginEventSystem( domEventName, eventSystemFlags, nativeEvent, return_targetInst, targetContainer );
            }

            if ( nextBlockedOn === blockedOn ) {
                break;
            }

            blockedOn = nextBlockedOn;
        }

        if ( blockedOn !== null ) {
            nativeEvent.stopPropagation();
        }

        return;
    }

    // This is not replayable so we'll invoke it but without a target,
    // in case the event system needs to trace it.
    dispatchEventForPluginEventSystem( domEventName, eventSystemFlags, nativeEvent, null, targetContainer );
}
