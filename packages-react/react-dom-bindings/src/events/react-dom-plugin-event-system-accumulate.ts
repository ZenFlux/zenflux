import { WorkTag } from "@zenflux/react-shared/src/react-internal-constants/work-tags";
import {
    enableCreateEventHandleAPI,
    enableFloat,
    enableHostSingletons, enableScopeAPI
} from "@zenflux/react-shared/src/react-feature-flags";

import getListener from "@zenflux/react-dom-bindings/src/events/getListener";

import { getEventHandlerListeners } from "@zenflux/react-dom-bindings/src/client/ReactDOMComponentTree";

import type { DOMEventName } from "@zenflux/react-dom-bindings/src/events/DOMEventNames";
import type { DispatchListener, DispatchQueue } from "@zenflux/react-dom-bindings/src/events/DOMPluginEventSystem";
import type { AnyNativeEvent } from "@zenflux/react-dom-bindings/src/events/PluginModuleType";
import type { ReactScopeInstance } from "@zenflux/react-shared/src/react-types";
import type { Fiber } from "@zenflux/react-shared/src/react-internal-types";
import type { KnownReactSyntheticEvent } from "@zenflux/react-dom-bindings/src/events/ReactSyntheticEventType";

function createDispatchListener( instance: null | Fiber, listener: any, currentTarget: EventTarget ): DispatchListener {
    return {
        instance,
        listener,
        currentTarget
    };
}

function getParent( inst: Fiber | null ): Fiber | null {
    if ( inst === null ) {
        return null;
    }

    do {
        // $FlowFixMe[incompatible-use] found when upgrading Flow
        inst = inst.return; // TODO: If this is a WorkTag.HostRoot we might want to bail out.
        // That is depending on if we want nested subtrees (layers) to bubble
        // events to their parent. We could also go through parentNode on the
        // host node but that wouldn't work for React Native and doesn't let us
        // do the portal feature.
    } while ( inst && inst.tag !== WorkTag.HostComponent && ( ! enableHostSingletons ? true : inst.tag !== WorkTag.HostSingleton ) );

    if ( inst ) {
        return inst;
    }

    return null;
}

/**
 * Return the lowest common ancestor of A and B, or null if they are in
 * different trees.
 */
function getLowestCommonAncestor( instA: Fiber, instB: Fiber ): Fiber | null {
    let nodeA: null | Fiber = instA;
    let nodeB: null | Fiber = instB;
    let depthA = 0;

    for ( let tempA: null | Fiber = nodeA ; tempA ; tempA = getParent( tempA ) ) {
        depthA++;
    }

    let depthB = 0;

    for ( let tempB: null | Fiber = nodeB ; tempB ; tempB = getParent( tempB ) ) {
        depthB++;
    }

    // If A is deeper, crawl up.
    while ( depthA - depthB > 0 ) {
        nodeA = getParent( nodeA );
        depthA--;
    }

    // If B is deeper, crawl up.
    while ( depthB - depthA > 0 ) {
        nodeB = getParent( nodeB );
        depthB--;
    }

    // Walk in lockstep until we find a match.
    let depth = depthA;

    while ( depth-- ) {
        if ( nodeA === nodeB || nodeB !== null && nodeA === nodeB.alternate ) {
            return nodeA;
        }

        nodeA = getParent( nodeA );
        nodeB = getParent( nodeB );
    }

    return null;
}

function accumulateEnterLeaveListenersForEvent( dispatchQueue: DispatchQueue, event: KnownReactSyntheticEvent, target: Fiber, common: Fiber | null, inCapturePhase: boolean ): void {
    const registrationName = event._reactName;
    const listeners: Array<DispatchListener> = [];
    let instance: null | Fiber = target;

    while ( instance !== null ) {
        if ( instance === common ) {
            break;
        }

        const {
            alternate,
            stateNode,
            tag
        } = instance;

        if ( alternate !== null && alternate === common ) {
            break;
        }

        if ( ( tag === WorkTag.HostComponent || ( enableFloat ? tag === WorkTag.HostHoistable : false ) || ( enableHostSingletons ? tag === WorkTag.HostSingleton : false ) ) && stateNode !== null ) {
            const currentTarget = stateNode;

            if ( inCapturePhase ) {
                const captureListener = getListener( instance, registrationName );

                if ( captureListener != null ) {
                    listeners.unshift( createDispatchListener( instance, captureListener, currentTarget ) );
                }
            } else if ( ! inCapturePhase ) {
                const bubbleListener = getListener( instance, registrationName );

                if ( bubbleListener != null ) {
                    listeners.push( createDispatchListener( instance, bubbleListener, currentTarget ) );
                }
            }
        }

        instance = instance.return;
    }

    if ( listeners.length !== 0 ) {
        dispatchQueue.push( {
            event,
            listeners
        } );
    }
}

// We should only use this function for:
// - EnterLeaveEventPlugin
// This is because we only process this plugin
// in the bubble phase, so we need to accumulate two
// phase event listeners.
export function accumulateEnterLeaveTwoPhaseListeners( dispatchQueue: DispatchQueue, leaveEvent: KnownReactSyntheticEvent, enterEvent: null | KnownReactSyntheticEvent, from: Fiber | null, to: Fiber | null ): void {
    const common = from && to ? getLowestCommonAncestor( from, to ) : null;

    if ( from !== null ) {
        accumulateEnterLeaveListenersForEvent( dispatchQueue, leaveEvent, from, common, false );
    }

    if ( to !== null && enterEvent !== null ) {
        accumulateEnterLeaveListenersForEvent( dispatchQueue, enterEvent, to, common, true );
    }
}

export function accumulateEventHandleNonManagedNodeListeners( reactEventType: DOMEventName, currentTarget: EventTarget, inCapturePhase: boolean ): Array<DispatchListener> {
    const listeners: Array<DispatchListener> = [];
    const eventListeners = getEventHandlerListeners( currentTarget );

    if ( eventListeners !== null ) {
        eventListeners.forEach( entry => {
            if ( entry.type === reactEventType && entry.capture === inCapturePhase ) {
                listeners.push( createDispatchListener( null, entry.callback, currentTarget ) );
            }
        } );
    }

    return listeners;
}

export function accumulateSinglePhaseListeners( targetFiber: Fiber | null, reactName: string | null, nativeEventType: string, inCapturePhase: boolean, accumulateTargetOnly: boolean, nativeEvent: AnyNativeEvent ): Array<DispatchListener> {
    const captureName = reactName !== null ? reactName + "Capture" : null;
    const reactEventName = inCapturePhase ? captureName : reactName;
    let listeners: Array<DispatchListener> = [];
    let instance = targetFiber;
    let lastHostComponent: ReactScopeInstance | EventTarget | null = null;

    // Accumulate all instances and listeners via the target -> root path.
    while ( instance !== null ) {
        const {
            stateNode,
            tag
        } = instance;

        // Handle listeners that are on HostComponents (i.e. <div>)
        if ( ( tag === WorkTag.HostComponent || ( enableFloat ? tag === WorkTag.HostHoistable : false ) || ( enableHostSingletons ? tag === WorkTag.HostSingleton : false ) ) && stateNode !== null ) {
            lastHostComponent = stateNode;

            if ( ! lastHostComponent ) {
                throw new Error( "Expected to have a lastHostComponent by now. This error is likely caused by a bug in React. Please file an issue." );
            }

            // createEventHandle listeners
            if ( enableCreateEventHandleAPI ) {
                const eventHandlerListeners = getEventHandlerListeners( lastHostComponent );

                if ( eventHandlerListeners !== null ) {
                    eventHandlerListeners.forEach( entry => {
                        if ( entry.type === nativeEventType && entry.capture === inCapturePhase ) {
                            listeners.push( createDispatchListener( instance, entry.callback, ( lastHostComponent as any ) ) );
                        }
                    } );
                }
            }

            // Standard React on* listeners, i.e. onClick or onClickCapture
            if ( reactEventName !== null ) {
                const listener = getListener( instance, reactEventName );

                if ( listener != null ) {
                    listeners.push( createDispatchListener( instance, listener, lastHostComponent as EventTarget ) );
                }
            }
        } else if ( enableCreateEventHandleAPI && enableScopeAPI && tag === WorkTag.ScopeComponent && lastHostComponent !== null && stateNode !== null ) {
            // Scopes
            const reactScopeInstance = stateNode;
            const eventHandlerListeners = getEventHandlerListeners( reactScopeInstance );

            if ( eventHandlerListeners !== null ) {
                eventHandlerListeners.forEach( entry => {
                    if ( entry.type === nativeEventType && entry.capture === inCapturePhase ) {
                        listeners.push( createDispatchListener( instance, entry.callback, ( lastHostComponent as any ) ) );
                    }
                } );
            }
        }

        // If we are only accumulating events for the target, then we don't
        // continue to propagate through the React fiber tree to find other
        // listeners.
        if ( accumulateTargetOnly ) {
            break;
        }

        // If we are processing the onBeforeBlur event, then we need to take
        // into consideration that part of the React tree might have been hidden
        // or deleted (as we're invoking this event during commit). We can find
        // this out by checking if intercept fiber set on the event matches the
        // current instance fiber. In which case, we should clear all existing
        // listeners.
        if ( enableCreateEventHandleAPI && nativeEvent.type === "beforeblur" ) {
            // $FlowFixMe[prop-missing] internal field
            // @ts-ignore
            const detachedInterceptFiber = nativeEvent._detachedInterceptFiber;

            if ( detachedInterceptFiber !== null && ( detachedInterceptFiber === instance || detachedInterceptFiber === instance.alternate ) ) {
                listeners = [];
            }
        }

        instance = instance.return;
    }

    return listeners;
}

// We should only use this function for:
// - BeforeInputEventPlugin
// - ChangeEventPlugin
// - SelectEventPlugin
// This is because we only process these plugins
// in the bubble phase, so we need to accumulate two
// phase event listeners (via emulation).
export function accumulateTwoPhaseListeners( targetFiber: Fiber | null, reactName: string ): Array<DispatchListener> {
    const captureName = reactName + "Capture";
    const listeners: Array<DispatchListener> = [];
    let instance = targetFiber;

    // Accumulate all instances and listeners via the target -> root path.
    while ( instance !== null ) {
        const {
            stateNode,
            tag
        } = instance;

        // Handle listeners that are on HostComponents (i.e. <div>)
        if ( ( tag === WorkTag.HostComponent || ( enableFloat ? tag === WorkTag.HostHoistable : false ) || ( enableHostSingletons ? tag === WorkTag.HostSingleton : false ) ) && stateNode !== null ) {
            const currentTarget = stateNode;
            const captureListener = getListener( instance, captureName );

            if ( captureListener != null ) {
                listeners.unshift( createDispatchListener( instance, captureListener, currentTarget ) );
            }

            const bubbleListener = getListener( instance, reactName );

            if ( bubbleListener != null ) {
                listeners.push( createDispatchListener( instance, bubbleListener, currentTarget ) );
            }
        }

        instance = instance.return;
    }

    return listeners;
}
