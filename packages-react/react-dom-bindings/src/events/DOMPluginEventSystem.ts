import { allNativeEvents } from "@zenflux/react-dom-bindings/src/events/EventRegistry";
import {
    getEventListenerSet
} from "@zenflux/react-dom-bindings/src/client/ReactDOMComponentTree";
import { DOCUMENT_NODE } from "@zenflux/react-dom-bindings/src/client/HTMLNodeType";

import {
    IS_CAPTURE_PHASE,
    IS_EVENT_HANDLE_NON_MANAGED_NODE,
    IS_NON_DELEGATED
} from "@zenflux/react-dom-bindings/src/events/EventSystemFlags";

import * as BeforeInputEventPlugin from "@zenflux/react-dom-bindings/src/events/plugins/BeforeInputEventPlugin";
import * as ChangeEventPlugin from "@zenflux/react-dom-bindings/src/events/plugins/ChangeEventPlugin";
import * as EnterLeaveEventPlugin from "@zenflux/react-dom-bindings/src/events/plugins/EnterLeaveEventPlugin";
import * as SelectEventPlugin from "@zenflux/react-dom-bindings/src/events/plugins/SelectEventPlugin";
import * as SimpleEventPlugin from "@zenflux/react-dom-bindings/src/events/plugins/SimpleEventPlugin";

import { addTrappedEventListener } from "@zenflux/react-dom-bindings/src/events/react-dom-plugin-event-system-trapped";

import type { Fiber } from "@zenflux/react-shared/src/react-internal-types";
import type { ReactSyntheticEvent } from "@zenflux/react-dom-bindings/src/events/ReactSyntheticEventType";
import type { DOMEventName } from "@zenflux/react-dom-bindings/src/events/DOMEventNames";

export type DispatchListener = {
    instance: null | Fiber;
    listener: ( ... args: Array<any> ) => any;
    currentTarget: EventTarget;
};
type DispatchEntry = {
    event: ReactSyntheticEvent;
    listeners: Array<DispatchListener>;
};
export type DispatchQueue = Array<DispatchEntry>;

// TODO: remove top-level side effect.
SimpleEventPlugin.registerEvents();
EnterLeaveEventPlugin.registerEvents();
ChangeEventPlugin.registerEvents();
SelectEventPlugin.registerEvents();
BeforeInputEventPlugin.registerEvents();

// List of events that need to be individually attached to media elements.
export const mediaEventTypes: Array<DOMEventName> = [ "abort", "canplay", "canplaythrough", "durationchange", "emptied", "encrypted", "ended", "error", "loadeddata", "loadedmetadata", "loadstart", "pause", "play", "playing", "progress", "ratechange", "resize", "seeked", "seeking", "stalled", "suspend", "timeupdate", "volumechange", "waiting" ];
// We should not delegate these events to the container, but rather
// set them on the actual target element itself. This is primarily
// because these events do not consistently bubble in the DOM.
export const nonDelegatedEvents: Set<DOMEventName> = new Set<DOMEventName>( [ "cancel", "close", "invalid", "load", "scroll", "scrollend", "toggle", // In order to reduce bytes, we insert the above array of media events
// into this Set. Note: the "error" event isn't an exclusive media event,
// and can occur on other elements too. Rather than duplicate that event,
// we just take it from the media events array.
    ... mediaEventTypes ] );

export function listenToNonDelegatedEvent( domEventName: DOMEventName, targetElement: Element ): void {
    if ( __DEV__ ) {
        if ( ! nonDelegatedEvents.has( domEventName ) ) {
            console.error( "Did not expect a listenToNonDelegatedEvent() call for \"%s\". " + "This is a bug in React. Please file an issue.", domEventName );
        }
    }

    const isCapturePhaseListener = false;
    const listenerSet = getEventListenerSet( targetElement );
    const listenerSetKey = getListenerSetKey( domEventName, isCapturePhaseListener );

    if ( ! listenerSet.has( listenerSetKey ) ) {
        addTrappedEventListener( targetElement, domEventName, IS_NON_DELEGATED, isCapturePhaseListener );
        listenerSet.add( listenerSetKey );
    }
}

export function listenToNativeEvent( domEventName: DOMEventName, isCapturePhaseListener: boolean, target: EventTarget ): void {
    if ( __DEV__ ) {
        if ( nonDelegatedEvents.has( domEventName ) && ! isCapturePhaseListener ) {
            console.error( "Did not expect a listenToNativeEvent() call for \"%s\" in the bubble phase. " + "This is a bug in React. Please file an issue.", domEventName );
        }
    }

    let eventSystemFlags = 0;

    if ( isCapturePhaseListener ) {
        eventSystemFlags |= IS_CAPTURE_PHASE;
    }

    addTrappedEventListener( target, domEventName, eventSystemFlags, isCapturePhaseListener );
}

// This is only used by createEventHandle when the
// target is not a DOM element. E.g. window.
export function listenToNativeEventForNonManagedEventTarget( domEventName: DOMEventName, isCapturePhaseListener: boolean, target: EventTarget ): void {
    let eventSystemFlags = IS_EVENT_HANDLE_NON_MANAGED_NODE;
    const listenerSet = getEventListenerSet( target );
    const listenerSetKey = getListenerSetKey( domEventName, isCapturePhaseListener );

    if ( ! listenerSet.has( listenerSetKey ) ) {
        if ( isCapturePhaseListener ) {
            eventSystemFlags |= IS_CAPTURE_PHASE;
        }

        addTrappedEventListener( target, domEventName, eventSystemFlags, isCapturePhaseListener );
        listenerSet.add( listenerSetKey );
    }
}

const listeningMarker = "_reactListening" + Math.random().toString( 36 ).slice( 2 );

export function listenToAllSupportedEvents( rootContainerElement: EventTarget ) {
    if ( ! ( rootContainerElement as any )[ listeningMarker ] ) {
        ( rootContainerElement as any )[ listeningMarker ] = true;
        allNativeEvents.forEach( domEventName => {
            // We handle selectionchange separately because it
            // doesn't bubble and needs to be on the document.
            if ( domEventName !== "selectionchange" ) {
                if ( ! nonDelegatedEvents.has( domEventName ) ) {
                    listenToNativeEvent( domEventName, false, rootContainerElement );
                }

                listenToNativeEvent( domEventName, true, rootContainerElement );
            }
        } );
        const ownerDocument = ( rootContainerElement as any ).nodeType === DOCUMENT_NODE ? rootContainerElement : ( rootContainerElement as any ).ownerDocument;

        if ( ownerDocument !== null ) {
            // The selectionchange event also needs deduplication
            // but it is attached to the document.
            if ( ! ( ownerDocument as any )[ listeningMarker ] ) {
                ( ownerDocument as any )[ listeningMarker ] = true;
                listenToNativeEvent( "selectionchange", false, ownerDocument );
            }
        }
    }
}

export function getListenerSetKey( domEventName: DOMEventName, capture: boolean ): string {
    return `${ domEventName }__${ capture ? "capture" : "bubble" }`;
}
