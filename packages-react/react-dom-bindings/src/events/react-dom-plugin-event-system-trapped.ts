import { enableLegacyFBSupport } from "@zenflux/react-shared/src/react-feature-flags";

import { passiveBrowserEventsSupported } from "@zenflux/react-dom-bindings/src/events/checkPassiveEvents";

import {
    addEventBubbleListener,
    addEventBubbleListenerWithPassiveFlag,
    addEventCaptureListener,
    addEventCaptureListenerWithPassiveFlag,
    removeEventListener
} from "@zenflux/react-dom-bindings/src/events/EventListener";

import { createEventListenerWrapperWithPriority } from "@zenflux/react-dom-bindings/src/events/react-dom-plugin-event-system-wrapper";

import type { DOMEventName } from "@zenflux/react-dom-bindings/src/events/DOMEventNames";
import type { EventSystemFlags } from "@zenflux/react-dom-bindings/src/events/EventSystemFlags";

export function addTrappedEventListener( targetContainer: EventTarget, domEventName: DOMEventName, eventSystemFlags: EventSystemFlags, isCapturePhaseListener: boolean, isDeferredListenerForLegacyFBSupport?: boolean ) {
    let listener = createEventListenerWrapperWithPriority( targetContainer, domEventName, eventSystemFlags );
    // If passive option is not supported, then the event will be
    // active and not passive.
    let isPassiveListener: boolean | undefined = undefined;

    if ( passiveBrowserEventsSupported ) {
        // Browsers introduced an intervention, making these events
        // passive by default on document. React doesn't bind them
        // to document anymore, but changing this now would undo
        // the performance wins from the change. So we emulate
        // the existing behavior manually on the roots now.
        // https://github.com/facebook/react/issues/19651
        if ( domEventName === "touchstart" || domEventName === "touchmove" || domEventName === "wheel" ) {
            isPassiveListener = true;
        }
    }

    targetContainer = enableLegacyFBSupport && isDeferredListenerForLegacyFBSupport ? ( targetContainer as any ).ownerDocument : targetContainer;
    let unsubscribeListener: {
        ( ... args: any[] ): any;
        ( ... args: any[] ): any;
        ( ... args: any[] ): any;
        ( ... args: any[] ): any;
        ( ... args: any[] ): any;
    };

    // When legacyFBSupport is enabled, it's for when we
    // want to add a one time event listener to a container.
    // This should only be used with enableLegacyFBSupport
    // due to requirement to provide compatibility with
    // internal FB www event tooling. This works by removing
    // the event listener as soon as it is invoked. We could
    // also attempt to use the {once: true} param on
    // addEventListener, but that requires support and some
    // browsers do not support this today, and given this is
    // to support legacy code patterns, it's likely they'll
    // need support for such browsers.
    if ( enableLegacyFBSupport && isDeferredListenerForLegacyFBSupport ) {
        const originalListener = listener;

        // $FlowFixMe[missing-this-annot]
        listener = function ( ... p ) {
            removeEventListener( targetContainer, domEventName, unsubscribeListener, isCapturePhaseListener );
            // @ts-ignore
            return originalListener.apply( this, p );
        };
    }

    // TODO: There are too many combinations here. Consolidate them.
    if ( isCapturePhaseListener ) {
        if ( isPassiveListener !== undefined ) {
            unsubscribeListener = addEventCaptureListenerWithPassiveFlag( targetContainer, domEventName, listener, isPassiveListener );
        } else {
            unsubscribeListener = addEventCaptureListener( targetContainer, domEventName, listener );
        }
    } else {
        if ( isPassiveListener !== undefined ) {
            unsubscribeListener = addEventBubbleListenerWithPassiveFlag( targetContainer, domEventName, listener, isPassiveListener );
        } else {
            unsubscribeListener = addEventBubbleListener( targetContainer, domEventName, listener );
        }
    }
}
