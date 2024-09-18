"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processDispatchQueue = void 0;
var react_error_utils_1 = require("@zenflux/react-shared/src/react-error-utils");
var EventSystemFlags_1 = require("@zenflux/react-dom-bindings/src/events/EventSystemFlags");
function executeDispatch(event, listener, currentTarget) {
    var type = event.type || "unknown-event";
    event.currentTarget = currentTarget;
    (0, react_error_utils_1.invokeGuardedCallbackAndCatchFirstError)(type, listener, undefined, event);
    event.currentTarget = null;
}
function processDispatchQueueItemsInOrder(event, dispatchListeners, inCapturePhase) {
    var previousInstance;
    if (inCapturePhase) {
        for (var i = dispatchListeners.length - 1; i >= 0; i--) {
            var _a = dispatchListeners[i], instance = _a.instance, currentTarget = _a.currentTarget, listener = _a.listener;
            if (instance !== previousInstance && event.isPropagationStopped()) {
                return;
            }
            executeDispatch(event, listener, currentTarget);
            previousInstance = instance;
        }
    }
    else {
        for (var i = 0; i < dispatchListeners.length; i++) {
            var _b = dispatchListeners[i], instance = _b.instance, currentTarget = _b.currentTarget, listener = _b.listener;
            if (instance !== previousInstance && event.isPropagationStopped()) {
                return;
            }
            executeDispatch(event, listener, currentTarget);
            previousInstance = instance;
        }
    }
}
function processDispatchQueue(dispatchQueue, eventSystemFlags) {
    var inCapturePhase = (eventSystemFlags & EventSystemFlags_1.IS_CAPTURE_PHASE) !== 0;
    for (var i = 0; i < dispatchQueue.length; i++) {
        var _a = dispatchQueue[i], event_1 = _a.event, listeners = _a.listeners;
        processDispatchQueueItemsInOrder(event_1, listeners, inCapturePhase); //  event system doesn't use pooling.
    }
    // This would be a good time to rethrow if any of the event handlers threw.
    (0, react_error_utils_1.rethrowCaughtError)();
}
exports.processDispatchQueue = processDispatchQueue;
