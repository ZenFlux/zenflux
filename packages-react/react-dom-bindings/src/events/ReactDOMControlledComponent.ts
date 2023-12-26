import { getFiberCurrentPropsFromNode, getInstanceFromNode } from "@zenflux/react-dom-bindings/src/client/ReactDOMComponentTree";
import { restoreControlledState } from "@zenflux/react-dom-bindings/src/client/ReactDOMTextarea";

// Use to restore controlled state after a change event has fired.
let restoreTarget: any = null;
let restoreQueue: any = null;

function restoreStateOfTarget( target: Node ) {
    // We perform this translation at the end of the event loop so that we
    // always receive the correct fiber here
    const internalInstance = getInstanceFromNode( target );

    if ( ! internalInstance ) {
        // Unmounted
        return;
    }

    const stateNode = internalInstance.stateNode;

    // Guard against Fiber being unmounted.
    if ( stateNode ) {
        const props = getFiberCurrentPropsFromNode( stateNode );
        restoreControlledState( internalInstance.stateNode, internalInstance.type, props );
    }
}

export function enqueueStateRestore( target: Node ): void {
    if ( restoreTarget ) {
        if ( restoreQueue ) {
            restoreQueue.push( target );
        } else {
            restoreQueue = [ target ];
        }
    } else {
        restoreTarget = target;
    }
}

export function needsStateRestore(): boolean {
    return restoreTarget !== null || restoreQueue !== null;
}

export function restoreStateIfNeeded() {
    if ( ! restoreTarget ) {
        return;
    }

    const target = restoreTarget;
    const queuedTargets = restoreQueue;
    restoreTarget = null;
    restoreQueue = null;
    restoreStateOfTarget( target );

    if ( queuedTargets ) {
        for ( let i = 0 ; i < queuedTargets.length ; i++ ) {
            restoreStateOfTarget( queuedTargets[ i ] );
        }
    }
}
