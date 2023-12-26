import { enableTransitionTracing } from "@zenflux/react-shared/src/react-feature-flags";

import type { Transition, TransitionAbort } from "@zenflux/react-shared/src/react-internal-types/transition";
import type { PendingBoundaries } from "@zenflux/react-shared/src/react-internal-types/boundaries";

import type { PendingTransitionCallbacks, } from "@zenflux/react-reconciler/src/react-fiber-tracing-marker-component";

let currentPendingTransitionCallbacks: PendingTransitionCallbacks | null = null;

export function addTransitionStartCallbackToPendingTransition( transition: Transition ) {
    if ( enableTransitionTracing ) {
        if ( currentPendingTransitionCallbacks === null ) {
            currentPendingTransitionCallbacks = {
                transitionStart: [],
                transitionProgress: null,
                transitionComplete: null,
                markerProgress: null,
                markerIncomplete: null,
                markerComplete: null
            };
        }

        if ( currentPendingTransitionCallbacks.transitionStart === null ) {
            currentPendingTransitionCallbacks.transitionStart = ( [] as Array<Transition> );
        }

        currentPendingTransitionCallbacks.transitionStart.push( transition );
    }
}

export function addMarkerProgressCallbackToPendingTransition( markerName: string,
                                                              transitions: Set<Transition>,
                                                              pendingBoundaries: PendingBoundaries ) {
    if ( enableTransitionTracing ) {
        if ( currentPendingTransitionCallbacks === null ) {
            currentPendingTransitionCallbacks = ( {
                transitionStart: null,
                transitionProgress: null,
                transitionComplete: null,
                markerProgress: new Map(),
                markerIncomplete: null,
                markerComplete: null
            } as PendingTransitionCallbacks );
        }

        if ( currentPendingTransitionCallbacks.markerProgress === null ) {
            currentPendingTransitionCallbacks.markerProgress = new Map();
        }

        currentPendingTransitionCallbacks.markerProgress.set( markerName, {
            pendingBoundaries,
            transitions
        } );
    }
}

export function addMarkerIncompleteCallbackToPendingTransition( markerName: string,
                                                                transitions: Set<Transition>,
                                                                aborts: Array<TransitionAbort> ) {
    if ( enableTransitionTracing ) {
        if ( currentPendingTransitionCallbacks === null ) {
            currentPendingTransitionCallbacks = {
                transitionStart: null,
                transitionProgress: null,
                transitionComplete: null,
                markerProgress: null,
                markerIncomplete: new Map(),
                markerComplete: null
            };
        }

        if ( currentPendingTransitionCallbacks.markerIncomplete === null ) {
            currentPendingTransitionCallbacks.markerIncomplete = new Map();
        }

        currentPendingTransitionCallbacks.markerIncomplete.set( markerName, {
            transitions,
            aborts
        } );
    }
}

export function addMarkerCompleteCallbackToPendingTransition( markerName: string, transitions: Set<Transition> ) {
    if ( enableTransitionTracing ) {
        if ( currentPendingTransitionCallbacks === null ) {
            currentPendingTransitionCallbacks = {
                transitionStart: null,
                transitionProgress: null,
                transitionComplete: null,
                markerProgress: null,
                markerIncomplete: null,
                markerComplete: new Map()
            };
        }

        if ( currentPendingTransitionCallbacks.markerComplete === null ) {
            currentPendingTransitionCallbacks.markerComplete = new Map();
        }

        currentPendingTransitionCallbacks.markerComplete.set( markerName, transitions );
    }
}

export function addTransitionProgressCallbackToPendingTransition( transition: Transition, boundaries: PendingBoundaries ) {
    if ( enableTransitionTracing ) {
        if ( currentPendingTransitionCallbacks === null ) {
            currentPendingTransitionCallbacks = {
                transitionStart: null,
                transitionProgress: new Map(),
                transitionComplete: null,
                markerProgress: null,
                markerIncomplete: null,
                markerComplete: null
            };
        }

        if ( currentPendingTransitionCallbacks.transitionProgress === null ) {
            currentPendingTransitionCallbacks.transitionProgress = new Map();
        }

        currentPendingTransitionCallbacks.transitionProgress.set( transition, boundaries );
    }
}

export function addTransitionCompleteCallbackToPendingTransition( transition: Transition ) {
    if ( enableTransitionTracing ) {
        if ( currentPendingTransitionCallbacks === null ) {
            currentPendingTransitionCallbacks = {
                transitionStart: null,
                transitionProgress: null,
                transitionComplete: [],
                markerProgress: null,
                markerIncomplete: null,
                markerComplete: null
            };
        }

        if ( currentPendingTransitionCallbacks.transitionComplete === null ) {
            currentPendingTransitionCallbacks.transitionComplete = ( [] as Array<Transition> );
        }

        currentPendingTransitionCallbacks.transitionComplete.push( transition );
    }
}

export function getCurrentPendingTransitionCallbacks() {
    return currentPendingTransitionCallbacks;
}

export function setCurrentPendingTransitionCallbacks( nextPendingTransitionCallbacks: PendingTransitionCallbacks | null ) {
    currentPendingTransitionCallbacks = nextPendingTransitionCallbacks;
}
