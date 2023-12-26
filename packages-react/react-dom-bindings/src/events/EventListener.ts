export function addEventBubbleListener( target: EventTarget, eventType: string, listener: ( ... args: Array<any> ) => any ): ( ... args: Array<any> ) => any {
    target.addEventListener( eventType, listener, false );
    return listener;
}

export function addEventCaptureListener( target: EventTarget, eventType: string, listener: ( ... args: Array<any> ) => any ): ( ... args: Array<any> ) => any {
    target.addEventListener( eventType, listener, true );
    return listener;
}

export function addEventCaptureListenerWithPassiveFlag( target: EventTarget, eventType: string, listener: ( ... args: Array<any> ) => any, passive: boolean ): ( ... args: Array<any> ) => any {
    target.addEventListener( eventType, listener, {
        capture: true,
        passive
    } );
    return listener;
}

export function addEventBubbleListenerWithPassiveFlag( target: EventTarget, eventType: string, listener: ( ... args: Array<any> ) => any, passive: boolean ): ( ... args: Array<any> ) => any {
    target.addEventListener( eventType, listener, {
        passive
    } );
    return listener;
}

export function removeEventListener( target: EventTarget, eventType: string, listener: ( ... args: Array<any> ) => any, capture: boolean ): void {
    target.removeEventListener( eventType, listener, capture );
}
