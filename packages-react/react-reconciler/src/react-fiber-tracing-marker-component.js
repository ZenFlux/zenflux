"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMarkerInstances = exports.popMarkerInstance = exports.pushMarkerInstance = exports.popRootMarkerInstance = exports.pushRootMarkerInstance = exports.processTransitionCallbacks = void 0;
var react_feature_flags_1 = require("@zenflux/react-shared/src/react-feature-flags");
var transition_1 = require("@zenflux/react-shared/src/react-internal-constants/transition");
var react_fiber_work_in_progress_1 = require("@zenflux/react-reconciler/src/react-fiber-work-in-progress");
var react_fiber_stack_1 = require("@zenflux/react-reconciler/src/react-fiber-stack");
function processTransitionCallbacks(pendingTransitions, endTime, callbacks) {
    if (react_feature_flags_1.enableTransitionTracing) {
        if (pendingTransitions !== null) {
            var transitionStart = pendingTransitions.transitionStart;
            var onTransitionStart_1 = callbacks.onTransitionStart;
            if (transitionStart !== null && onTransitionStart_1 != null) {
                transitionStart.forEach(function (transition) { return onTransitionStart_1(transition.name, transition.startTime); });
            }
            var markerProgress = pendingTransitions.markerProgress;
            var onMarkerProgress_1 = callbacks.onMarkerProgress;
            if (onMarkerProgress_1 != null && markerProgress !== null) {
                markerProgress.forEach(function (markerInstance, markerName) {
                    if (markerInstance.transitions !== null) {
                        // TODO: Clone the suspense object so users can't modify it
                        var pending_1 = markerInstance.pendingBoundaries !== null ? Array.from(markerInstance.pendingBoundaries.values()) : [];
                        markerInstance.transitions.forEach(function (transition) {
                            onMarkerProgress_1(transition.name, markerName, transition.startTime, endTime, pending_1);
                        });
                    }
                });
            }
            var markerComplete = pendingTransitions.markerComplete;
            var onMarkerComplete_1 = callbacks.onMarkerComplete;
            if (markerComplete !== null && onMarkerComplete_1 != null) {
                markerComplete.forEach(function (transitions, markerName) {
                    transitions.forEach(function (transition) {
                        onMarkerComplete_1(transition.name, markerName, transition.startTime, endTime);
                    });
                });
            }
            var markerIncomplete = pendingTransitions.markerIncomplete;
            var onMarkerIncomplete_1 = callbacks.onMarkerIncomplete;
            if (onMarkerIncomplete_1 != null && markerIncomplete !== null) {
                markerIncomplete.forEach(function (_a, markerName) {
                    var transitions = _a.transitions, aborts = _a.aborts;
                    transitions.forEach(function (transition) {
                        var filteredAborts = [];
                        aborts.forEach(function (abort) {
                            switch (abort.reason) {
                                case "marker": {
                                    filteredAborts.push({
                                        type: "marker",
                                        name: abort.name,
                                        endTime: endTime
                                    });
                                    break;
                                }
                                case "suspense": {
                                    filteredAborts.push({
                                        type: "suspense",
                                        name: abort.name,
                                        endTime: endTime
                                    });
                                    break;
                                }
                                default: {
                                    break;
                                }
                            }
                        });
                        if (filteredAborts.length > 0) {
                            onMarkerIncomplete_1(transition.name, markerName, transition.startTime, filteredAborts);
                        }
                    });
                });
            }
            var transitionProgress = pendingTransitions.transitionProgress;
            var onTransitionProgress_1 = callbacks.onTransitionProgress;
            if (onTransitionProgress_1 != null && transitionProgress !== null) {
                transitionProgress.forEach(function (pending, transition) {
                    onTransitionProgress_1(transition.name, transition.startTime, endTime, Array.from(pending.values()));
                });
            }
            var transitionComplete = pendingTransitions.transitionComplete;
            var onTransitionComplete_1 = callbacks.onTransitionComplete;
            if (transitionComplete !== null && onTransitionComplete_1 != null) {
                transitionComplete.forEach(function (transition) { return onTransitionComplete_1(transition.name, transition.startTime, endTime); });
            }
        }
    }
}
exports.processTransitionCallbacks = processTransitionCallbacks;
// For every tracing marker, store a pointer to it. We will later access it
// to get the set of suspense boundaries that need to resolve before the
// tracing marker can be logged as complete
// This code lives separate from the ReactFiberTransition code because
// we push and pop on the tracing marker, not the suspense boundary
var markerInstanceStack = (0, react_fiber_stack_1.createCursor)(null);
function pushRootMarkerInstance(workInProgress) {
    if (react_feature_flags_1.enableTransitionTracing) {
        // On the root, every transition gets mapped to it's own map of
        // suspense boundaries. The transition is marked as complete when
        // the suspense boundaries map is empty. We do this because every
        // transition completes at different times and depends on different
        // suspense boundaries to complete. We store all the transitions
        // along with its map of suspense boundaries in the root incomplete
        // transitions map. Each entry in this map functions like a tracing
        // marker does, so we can push it onto the marker instance stack
        var transitions = (0, react_fiber_work_in_progress_1.getWorkInProgressTransitions)();
        var root_1 = workInProgress.stateNode;
        if (transitions !== null) {
            transitions.forEach(function (transition) {
                if (!root_1.incompleteTransitions.has(transition)) {
                    var markerInstance = {
                        tag: transition_1.TracingMarkerTag.TransitionRoot,
                        transitions: new Set([transition]),
                        pendingBoundaries: null,
                        aborts: null,
                        name: null
                    };
                    root_1.incompleteTransitions.set(transition, markerInstance);
                }
            });
        }
        var markerInstances_1 = [];
        // For ever transition on the suspense boundary, we push the transition
        // along with its map of pending suspense boundaries onto the marker
        // instance stack.
        root_1.incompleteTransitions.forEach(function (markerInstance) {
            markerInstances_1.push(markerInstance);
        });
        (0, react_fiber_stack_1.push)(markerInstanceStack, markerInstances_1, workInProgress);
    }
}
exports.pushRootMarkerInstance = pushRootMarkerInstance;
function popRootMarkerInstance(workInProgress) {
    if (react_feature_flags_1.enableTransitionTracing) {
        (0, react_fiber_stack_1.pop)(markerInstanceStack, workInProgress);
    }
}
exports.popRootMarkerInstance = popRootMarkerInstance;
function pushMarkerInstance(workInProgress, markerInstance) {
    if (react_feature_flags_1.enableTransitionTracing) {
        if (markerInstanceStack.current === null) {
            (0, react_fiber_stack_1.push)(markerInstanceStack, [markerInstance], workInProgress);
        }
        else {
            (0, react_fiber_stack_1.push)(markerInstanceStack, markerInstanceStack.current.concat(markerInstance), workInProgress);
        }
    }
}
exports.pushMarkerInstance = pushMarkerInstance;
function popMarkerInstance(workInProgress) {
    if (react_feature_flags_1.enableTransitionTracing) {
        (0, react_fiber_stack_1.pop)(markerInstanceStack, workInProgress);
    }
}
exports.popMarkerInstance = popMarkerInstance;
function getMarkerInstances() {
    if (react_feature_flags_1.enableTransitionTracing) {
        return markerInstanceStack.current;
    }
    return null;
}
exports.getMarkerInstances = getMarkerInstances;
