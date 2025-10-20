import { enableTransitionTracing } from "@zenflux/react-shared/src/react-feature-flags";

import { TracingMarkerTag } from "@zenflux/react-shared/src/react-internal-constants/transition";

import { getWorkInProgressTransitions } from "@zenflux/react-reconciler/src/react-fiber-work-in-progress";
import { createCursor, pop, push } from "@zenflux/react-reconciler/src/react-fiber-stack";

import type { Transition, TransitionAbort } from "@zenflux/react-shared/src/react-internal-types/transition";

import type { StackCursor } from "@zenflux/react-reconciler/src/react-fiber-stack";

import type { Fiber, FiberRoot, TransitionTracingCallbacks } from "@zenflux/react-shared/src/react-internal-types";
import type { PendingBoundaries } from "@zenflux/react-shared/src/react-internal-types/boundaries";
import type { TracingMarkerInstance } from "@zenflux/react-shared/src/react-internal-types/tracing";

export type PendingTransitionCallbacks = {
    transitionStart: Array<Transition> | null;
    transitionProgress: Map<Transition, PendingBoundaries> | null;
    transitionComplete: Array<Transition> | null;
    markerProgress: Map<string, {
        pendingBoundaries: PendingBoundaries;
        transitions: Set<Transition>;
    }> | null;
    markerIncomplete: Map<string, {
        aborts: Array<TransitionAbort>;
        transitions: Set<Transition>;
    }> | null;
    markerComplete: Map<string, Set<Transition>> | null;
};

export function processTransitionCallbacks( pendingTransitions: PendingTransitionCallbacks, endTime: number, callbacks: TransitionTracingCallbacks ): void {
    if ( enableTransitionTracing ) {
        if ( pendingTransitions !== null ) {
            const transitionStart = pendingTransitions.transitionStart;
            const onTransitionStart = callbacks.onTransitionStart;

            if ( transitionStart !== null && onTransitionStart != null ) {
                transitionStart.forEach( transition => onTransitionStart( transition.name, transition.startTime ) );
            }

            const markerProgress = pendingTransitions.markerProgress;
            const onMarkerProgress = callbacks.onMarkerProgress;

            if ( onMarkerProgress != null && markerProgress !== null ) {
                markerProgress.forEach( ( markerInstance, markerName ) => {
                    if ( markerInstance.transitions !== null ) {
                        // TODO: Clone the suspense object so users can't modify it
                        const pending = markerInstance.pendingBoundaries !== null ? Array.from( markerInstance.pendingBoundaries.values() ) : [];
                        markerInstance.transitions.forEach( transition => {
                            onMarkerProgress( transition.name, markerName, transition.startTime, endTime, pending );
                        } );
                    }
                } );
            }

            const markerComplete = pendingTransitions.markerComplete;
            const onMarkerComplete = callbacks.onMarkerComplete;

            if ( markerComplete !== null && onMarkerComplete != null ) {
                markerComplete.forEach( ( transitions, markerName ) => {
                    transitions.forEach( transition => {
                        onMarkerComplete( transition.name, markerName, transition.startTime, endTime );
                    } );
                } );
            }

            const markerIncomplete = pendingTransitions.markerIncomplete;
            const onMarkerIncomplete = callbacks.onMarkerIncomplete;

            if ( onMarkerIncomplete != null && markerIncomplete !== null ) {
                markerIncomplete.forEach( ( {
                    transitions,
                    aborts
                }, markerName ) => {
                    transitions.forEach( transition => {
                        const filteredAborts: any[] = [];
                        aborts.forEach( abort => {
                            switch ( abort.reason ) {
                                case "marker": {
                                    filteredAborts.push( {
                                        type: "marker",
                                        name: abort.name,
                                        endTime
                                    } );
                                    break;
                                }

                                case "suspense": {
                                    filteredAborts.push( {
                                        type: "suspense",
                                        name: abort.name,
                                        endTime
                                    } );
                                    break;
                                }

                                default: {
                                    break;
                                }
                            }
                        } );

                        if ( filteredAborts.length > 0 ) {
                            onMarkerIncomplete( transition.name, markerName, transition.startTime, filteredAborts );
                        }
                    } );
                } );
            }

            const transitionProgress = pendingTransitions.transitionProgress;
            const onTransitionProgress = callbacks.onTransitionProgress;

            if ( onTransitionProgress != null && transitionProgress !== null ) {
                transitionProgress.forEach( ( pending, transition ) => {
                    onTransitionProgress( transition.name, transition.startTime, endTime, Array.from( pending.values() ) );
                } );
            }

            const transitionComplete = pendingTransitions.transitionComplete;
            const onTransitionComplete = callbacks.onTransitionComplete;

            if ( transitionComplete !== null && onTransitionComplete != null ) {
                transitionComplete.forEach( transition => onTransitionComplete( transition.name, transition.startTime, endTime ) );
            }
        }
    }
}

// For every tracing marker, store a pointer to it. We will later access it
// to get the set of suspense boundaries that need to resolve before the
// tracing marker can be logged as complete
// This code lives separate from the ReactFiberTransition code because
// we push and pop on the tracing marker, not the suspense boundary
const markerInstanceStack: StackCursor<Array<TracingMarkerInstance> | null> = createCursor( null );

export function pushRootMarkerInstance( workInProgress: Fiber ): void {
    if ( enableTransitionTracing ) {
        // On the root, every transition gets mapped to it's own map of
        // suspense boundaries. The transition is marked as complete when
        // the suspense boundaries map is empty. We do this because every
        // transition completes at different times and depends on different
        // suspense boundaries to complete. We store all the transitions
        // along with its map of suspense boundaries in the root incomplete
        // transitions map. Each entry in this map functions like a tracing
        // marker does, so we can push it onto the marker instance stack
        const transitions = getWorkInProgressTransitions();
        const root: FiberRoot = workInProgress.stateNode;

        if ( transitions !== null ) {
            transitions.forEach( transition => {
                if ( ! root.incompleteTransitions.has( transition ) ) {
                    const markerInstance: TracingMarkerInstance = {
                        tag: TracingMarkerTag.TransitionRoot,
                        transitions: new Set( [ transition ] ),
                        pendingBoundaries: null,
                        aborts: null,
                        name: null
                    };
                    root.incompleteTransitions.set( transition, markerInstance );
                }
            } );
        }

        const markerInstances: any[] | null = [];
        // For ever transition on the suspense boundary, we push the transition
        // along with its map of pending suspense boundaries onto the marker
        // instance stack.
        root.incompleteTransitions.forEach( markerInstance => {
            markerInstances.push( markerInstance );
        } );
        push( markerInstanceStack, markerInstances, workInProgress );
    }
}

export function popRootMarkerInstance( workInProgress: Fiber ) {
    if ( enableTransitionTracing ) {
        pop( markerInstanceStack, workInProgress );
    }
}

export function pushMarkerInstance( workInProgress: Fiber, markerInstance: TracingMarkerInstance ): void {
    if ( enableTransitionTracing ) {
        if ( markerInstanceStack.current === null ) {
            push( markerInstanceStack, [ markerInstance ], workInProgress );
        } else {
            push( markerInstanceStack, markerInstanceStack.current.concat( markerInstance ), workInProgress );
        }
    }
}

export function popMarkerInstance( workInProgress: Fiber ): void {
    if ( enableTransitionTracing ) {
        pop( markerInstanceStack, workInProgress );
    }
}

export function getMarkerInstances(): Array<TracingMarkerInstance> | null {
    if ( enableTransitionTracing ) {
        return markerInstanceStack.current;
    }

    return null;
}
