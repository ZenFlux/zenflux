import {
    invokeGuardedCallbackAndCatchFirstError,
    rethrowCaughtError
} from "@zenflux/react-shared/src/react-error-utils";

import { IS_CAPTURE_PHASE } from "@zenflux/react-dom-bindings/src/events/EventSystemFlags";

import type { EventSystemFlags } from "@zenflux/react-dom-bindings/src/events/EventSystemFlags";
import type { DispatchListener, DispatchQueue } from "@zenflux/react-dom-bindings/src/events/DOMPluginEventSystem";
import type { ReactSyntheticEvent } from "@zenflux/react-dom-bindings/src/events/ReactSyntheticEventType";

function executeDispatch( event: ReactSyntheticEvent, listener: ( ... args: Array<any> ) => any, currentTarget: EventTarget ): void {
    const type = event.type || "unknown-event";
    event.currentTarget = currentTarget;
    invokeGuardedCallbackAndCatchFirstError( type, listener, undefined, event );
    event.currentTarget = null;
}

function processDispatchQueueItemsInOrder( event: ReactSyntheticEvent, dispatchListeners: Array<DispatchListener>, inCapturePhase: boolean ): void {
    let previousInstance;

    if ( inCapturePhase ) {
        for ( let i = dispatchListeners.length - 1 ; i >= 0 ; i-- ) {
            const {
                instance,
                currentTarget,
                listener
            } = dispatchListeners[ i ];

            if ( instance !== previousInstance && event.isPropagationStopped() ) {
                return;
            }

            executeDispatch( event, listener, currentTarget );
            previousInstance = instance;
        }
    } else {
        for ( let i = 0 ; i < dispatchListeners.length ; i++ ) {
            const {
                instance,
                currentTarget,
                listener
            } = dispatchListeners[ i ];

            if ( instance !== previousInstance && event.isPropagationStopped() ) {
                return;
            }

            executeDispatch( event, listener, currentTarget );
            previousInstance = instance;
        }
    }
}

export function processDispatchQueue( dispatchQueue: DispatchQueue, eventSystemFlags: EventSystemFlags ): void {
    const inCapturePhase = ( eventSystemFlags & IS_CAPTURE_PHASE ) !== 0;

    for ( let i = 0 ; i < dispatchQueue.length ; i++ ) {
        const {
            event,
            listeners
        } = dispatchQueue[ i ];
        processDispatchQueueItemsInOrder( event, listeners, inCapturePhase ); //  event system doesn't use pooling.
    }

    // This would be a good time to rethrow if any of the event handlers threw.
    rethrowCaughtError();
}
