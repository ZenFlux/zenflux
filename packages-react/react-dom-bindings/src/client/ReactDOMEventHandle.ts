import { enableCreateEventHandleAPI, enableScopeAPI } from "@zenflux/react-shared/src/react-feature-flags";

import { allNativeEvents } from "../events/EventRegistry";
import { listenToNativeEventForNonManagedEventTarget } from "../events/DOMPluginEventSystem";

import {
    addEventHandleToTarget,
    doesTargetHaveEventHandle,
    getEventHandlerListeners,
    setEventHandlerListeners
} from "@zenflux/react-dom-bindings/src/client/ReactDOMComponentTree";

import { ELEMENT_NODE } from "@zenflux/react-dom-bindings/src/client/HTMLNodeType";

import type { ReactScopeInstance } from "@zenflux/react-shared/src/react-types";

import type { DOMEventName } from "../events/DOMEventNames";
import type {
    ReactDOMEventHandle,
    ReactDOMEventHandleListener
} from "@zenflux/react-dom-bindings/src/client/ReactDOMEventHandleTypes";

type EventHandleOptions = {
    capture?: boolean;
};

function isValidEventTarget( target: EventTarget | ReactScopeInstance ): boolean {
    return typeof ( target as Record<string, any> ).addEventListener === "function";
}

function isReactScope( target: EventTarget | ReactScopeInstance ): boolean {
    return typeof ( target as Record<string, any> ).getChildContextValues === "function";
}

function createEventHandleListener( type: DOMEventName, isCapturePhaseListener: boolean, callback: ( arg0: React.SyntheticEvent<EventTarget> ) => void ): ReactDOMEventHandleListener {
    return {
        callback,
        capture: isCapturePhaseListener,
        type
    };
}

function registerReactDOMEvent( target: EventTarget | ReactScopeInstance, domEventName: DOMEventName, isCapturePhaseListener: boolean ): void {
    if ( ( target as any ).nodeType === ELEMENT_NODE ) {// Do nothing. We already attached all root listeners.
    } else if ( enableScopeAPI && isReactScope( target ) ) {// Do nothing. We already attached all root listeners.
    } else if ( isValidEventTarget( target ) ) {
        const eventTarget = ( ( target as any ) as EventTarget );
        // These are valid event targets, but they are also
        // non-managed React nodes.
        listenToNativeEventForNonManagedEventTarget( domEventName, isCapturePhaseListener, eventTarget );
    } else {
        throw new Error( "ReactDOM.createEventHandle: setter called on an invalid " + "target. Provide a valid EventTarget or an element managed by React." );
    }
}

export function createEventHandle( type: string, options?: EventHandleOptions ): ReactDOMEventHandle {
    if ( enableCreateEventHandleAPI ) {
        const domEventName = ( ( type as any ) as DOMEventName );

        // We cannot support arbitrary native events with eager root listeners
        // because the eager strategy relies on knowing the whole list ahead of time.
        // If we wanted to support this, we'd have to add code to keep track
        // (or search) for all portal and root containers, and lazily add listeners
        // to them whenever we see a previously unknown event. This seems like a lot
        // of complexity for something we don't even have a particular use case for.
        // Unfortunately, the downside of this invariant is that *removing* a native
        // event from the list of known events has now become a breaking change for
        // any code relying on the createEventHandle API.
        if ( ! allNativeEvents.has( domEventName ) ) {
            throw new Error( `Cannot call unstable_createEventHandle with "${ domEventName }", as it is not an event known to React.` );
        }

        let isCapturePhaseListener = false;

        if ( options != null ) {
            const optionsCapture = options.capture;

            if ( typeof optionsCapture === "boolean" ) {
                isCapturePhaseListener = optionsCapture;
            }
        }

        const eventHandle: ReactDOMEventHandle = ( target: EventTarget | ReactScopeInstance, callback: ( arg0: React.SyntheticEvent<EventTarget> ) => void ) => {
            if ( typeof callback !== "function" ) {
                throw new Error( "ReactDOM.createEventHandle: setter called with an invalid " + "callback. The callback must be a function." );
            }

            if ( ! doesTargetHaveEventHandle( target, eventHandle ) ) {
                addEventHandleToTarget( target, eventHandle );
                registerReactDOMEvent( target, domEventName, isCapturePhaseListener );
            }

            const listener = createEventHandleListener( domEventName, isCapturePhaseListener, callback );
            let targetListeners = getEventHandlerListeners( target );

            if ( targetListeners === null ) {
                targetListeners = new Set();
                setEventHandlerListeners( target, targetListeners );
            }

            targetListeners.add( listener );
            return () => {
                ( ( targetListeners as any ) as Set<ReactDOMEventHandleListener> ).delete( listener );
            };
        };

        return eventHandle;
    }

    return ( null as any );
}
