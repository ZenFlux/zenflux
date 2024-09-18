"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setCurrentPendingTransitionCallbacks = exports.getCurrentPendingTransitionCallbacks = exports.addTransitionCompleteCallbackToPendingTransition = exports.addTransitionProgressCallbackToPendingTransition = exports.addMarkerCompleteCallbackToPendingTransition = exports.addMarkerIncompleteCallbackToPendingTransition = exports.addMarkerProgressCallbackToPendingTransition = exports.addTransitionStartCallbackToPendingTransition = void 0;
var react_feature_flags_1 = require("@zenflux/react-shared/src/react-feature-flags");
var currentPendingTransitionCallbacks = null;
function addTransitionStartCallbackToPendingTransition(transition) {
    if (react_feature_flags_1.enableTransitionTracing) {
        if (currentPendingTransitionCallbacks === null) {
            currentPendingTransitionCallbacks = {
                transitionStart: [],
                transitionProgress: null,
                transitionComplete: null,
                markerProgress: null,
                markerIncomplete: null,
                markerComplete: null
            };
        }
        if (currentPendingTransitionCallbacks.transitionStart === null) {
            currentPendingTransitionCallbacks.transitionStart = [];
        }
        currentPendingTransitionCallbacks.transitionStart.push(transition);
    }
}
exports.addTransitionStartCallbackToPendingTransition = addTransitionStartCallbackToPendingTransition;
function addMarkerProgressCallbackToPendingTransition(markerName, transitions, pendingBoundaries) {
    if (react_feature_flags_1.enableTransitionTracing) {
        if (currentPendingTransitionCallbacks === null) {
            currentPendingTransitionCallbacks = {
                transitionStart: null,
                transitionProgress: null,
                transitionComplete: null,
                markerProgress: new Map(),
                markerIncomplete: null,
                markerComplete: null
            };
        }
        if (currentPendingTransitionCallbacks.markerProgress === null) {
            currentPendingTransitionCallbacks.markerProgress = new Map();
        }
        currentPendingTransitionCallbacks.markerProgress.set(markerName, {
            pendingBoundaries: pendingBoundaries,
            transitions: transitions
        });
    }
}
exports.addMarkerProgressCallbackToPendingTransition = addMarkerProgressCallbackToPendingTransition;
function addMarkerIncompleteCallbackToPendingTransition(markerName, transitions, aborts) {
    if (react_feature_flags_1.enableTransitionTracing) {
        if (currentPendingTransitionCallbacks === null) {
            currentPendingTransitionCallbacks = {
                transitionStart: null,
                transitionProgress: null,
                transitionComplete: null,
                markerProgress: null,
                markerIncomplete: new Map(),
                markerComplete: null
            };
        }
        if (currentPendingTransitionCallbacks.markerIncomplete === null) {
            currentPendingTransitionCallbacks.markerIncomplete = new Map();
        }
        currentPendingTransitionCallbacks.markerIncomplete.set(markerName, {
            transitions: transitions,
            aborts: aborts
        });
    }
}
exports.addMarkerIncompleteCallbackToPendingTransition = addMarkerIncompleteCallbackToPendingTransition;
function addMarkerCompleteCallbackToPendingTransition(markerName, transitions) {
    if (react_feature_flags_1.enableTransitionTracing) {
        if (currentPendingTransitionCallbacks === null) {
            currentPendingTransitionCallbacks = {
                transitionStart: null,
                transitionProgress: null,
                transitionComplete: null,
                markerProgress: null,
                markerIncomplete: null,
                markerComplete: new Map()
            };
        }
        if (currentPendingTransitionCallbacks.markerComplete === null) {
            currentPendingTransitionCallbacks.markerComplete = new Map();
        }
        currentPendingTransitionCallbacks.markerComplete.set(markerName, transitions);
    }
}
exports.addMarkerCompleteCallbackToPendingTransition = addMarkerCompleteCallbackToPendingTransition;
function addTransitionProgressCallbackToPendingTransition(transition, boundaries) {
    if (react_feature_flags_1.enableTransitionTracing) {
        if (currentPendingTransitionCallbacks === null) {
            currentPendingTransitionCallbacks = {
                transitionStart: null,
                transitionProgress: new Map(),
                transitionComplete: null,
                markerProgress: null,
                markerIncomplete: null,
                markerComplete: null
            };
        }
        if (currentPendingTransitionCallbacks.transitionProgress === null) {
            currentPendingTransitionCallbacks.transitionProgress = new Map();
        }
        currentPendingTransitionCallbacks.transitionProgress.set(transition, boundaries);
    }
}
exports.addTransitionProgressCallbackToPendingTransition = addTransitionProgressCallbackToPendingTransition;
function addTransitionCompleteCallbackToPendingTransition(transition) {
    if (react_feature_flags_1.enableTransitionTracing) {
        if (currentPendingTransitionCallbacks === null) {
            currentPendingTransitionCallbacks = {
                transitionStart: null,
                transitionProgress: null,
                transitionComplete: [],
                markerProgress: null,
                markerIncomplete: null,
                markerComplete: null
            };
        }
        if (currentPendingTransitionCallbacks.transitionComplete === null) {
            currentPendingTransitionCallbacks.transitionComplete = [];
        }
        currentPendingTransitionCallbacks.transitionComplete.push(transition);
    }
}
exports.addTransitionCompleteCallbackToPendingTransition = addTransitionCompleteCallbackToPendingTransition;
function getCurrentPendingTransitionCallbacks() {
    return currentPendingTransitionCallbacks;
}
exports.getCurrentPendingTransitionCallbacks = getCurrentPendingTransitionCallbacks;
function setCurrentPendingTransitionCallbacks(nextPendingTransitionCallbacks) {
    currentPendingTransitionCallbacks = nextPendingTransitionCallbacks;
}
exports.setCurrentPendingTransitionCallbacks = setCurrentPendingTransitionCallbacks;
