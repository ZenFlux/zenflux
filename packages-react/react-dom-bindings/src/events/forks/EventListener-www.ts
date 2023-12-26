const EventListenerWWW = require( 'EventListener' );

import

typeof * as;
EventListenerType;
from;
"../EventListener";
import

typeof * as;
EventListenerShimType;
from;
"./EventListener-www";

export function addEventBubbleListener( target: EventTarget, eventType: string, listener: ( ... args: Array<any> ) => any ): unknown {
    return EventListenerWWW.listen( target, eventType, listener );
}

export function addEventCaptureListener( target: EventTarget, eventType: string, listener: ( ... args: Array<any> ) => any ): unknown {
    return EventListenerWWW.capture( target, eventType, listener );
}

export function addEventCaptureListenerWithPassiveFlag( target: EventTarget, eventType: string, listener: ( ... args: Array<any> ) => any, passive: boolean ): unknown {
    return EventListenerWWW.captureWithPassiveFlag( target, eventType, listener, passive );
}

export function addEventBubbleListenerWithPassiveFlag( target: EventTarget, eventType: string, listener: ( ... args: Array<any> ) => any, passive: boolean ): unknown {
    return EventListenerWWW.bubbleWithPassiveFlag( target, eventType, listener, passive );
}

export function removeEventListener( target: EventTarget, eventType: string, listener: ( ... args: Array<any> ) => any, capture: boolean ) {
    listener.remove();
}

// Flow magic to verify the exports of this file match the original version.
( ( ( ( null as any ) as EventListenerType ) as EventListenerShimType ) as EventListenerType );
