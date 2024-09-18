"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isReplayingEvent = exports.resetReplayingEvent = exports.setReplayingEvent = void 0;
// This exists to avoid circular dependency between ReactDOMEventReplaying
// and DOMPluginEventSystem.
var currentReplayingEvent = null;
function setReplayingEvent(event) {
    if (__DEV__) {
        if (currentReplayingEvent !== null) {
            console.error("Expected currently replaying event to be null. This error " + "is likely caused by a bug in React. Please file an issue.");
        }
    }
    currentReplayingEvent = event;
}
exports.setReplayingEvent = setReplayingEvent;
function resetReplayingEvent() {
    if (__DEV__) {
        if (currentReplayingEvent === null) {
            console.error("Expected currently replaying event to not be null. This error " + "is likely caused by a bug in React. Please file an issue.");
        }
    }
    currentReplayingEvent = null;
}
exports.resetReplayingEvent = resetReplayingEvent;
function isReplayingEvent(event) {
    return event === currentReplayingEvent;
}
exports.isReplayingEvent = isReplayingEvent;
