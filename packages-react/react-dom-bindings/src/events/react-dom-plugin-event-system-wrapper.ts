import {
    ContinuousEventPriority,
    DefaultEventPriority,
    DiscreteEventPriority
} from "@zenflux/react-reconciler/src/react-event-priorities";

import { dispatchEventEx } from "@zenflux/react-dom-bindings/src/client/react-dom-event-listener-dispatch-ex";

import {
    dispatchContinuousEvent,
    dispatchDiscreteEvent,
} from "@zenflux/react-dom-bindings/src/client/react-dom-event-listener-dispatch";

import { getEventPriority } from "@zenflux/react-dom-bindings/src/events/react-dom-event-listener-priority";

import type { DOMEventName } from "@zenflux/react-dom-bindings/src/events/DOMEventNames";
import type { EventSystemFlags } from "@zenflux/react-dom-bindings/src/events/EventSystemFlags";

export function createEventListenerWrapperWithPriority( targetContainer: EventTarget, domEventName: DOMEventName, eventSystemFlags: EventSystemFlags ): ( ... args: Array<any> ) => any {
    const eventPriority = getEventPriority( domEventName );
    let listenerWrapper;

    switch ( eventPriority ) {
        case DiscreteEventPriority:
            listenerWrapper = dispatchDiscreteEvent;
            break;

        case ContinuousEventPriority:
            listenerWrapper = dispatchContinuousEvent;
            break;

        case DefaultEventPriority:
        default:
            listenerWrapper = dispatchEventEx;
            break;
    }

    return listenerWrapper.bind( null, domEventName, eventSystemFlags, targetContainer );
}
