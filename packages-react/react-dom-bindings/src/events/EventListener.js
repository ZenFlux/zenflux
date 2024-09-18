"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeEventListener = exports.addEventBubbleListenerWithPassiveFlag = exports.addEventCaptureListenerWithPassiveFlag = exports.addEventCaptureListener = exports.addEventBubbleListener = void 0;
function addEventBubbleListener(target, eventType, listener) {
    target.addEventListener(eventType, listener, false);
    return listener;
}
exports.addEventBubbleListener = addEventBubbleListener;
function addEventCaptureListener(target, eventType, listener) {
    target.addEventListener(eventType, listener, true);
    return listener;
}
exports.addEventCaptureListener = addEventCaptureListener;
function addEventCaptureListenerWithPassiveFlag(target, eventType, listener, passive) {
    target.addEventListener(eventType, listener, {
        capture: true,
        passive: passive
    });
    return listener;
}
exports.addEventCaptureListenerWithPassiveFlag = addEventCaptureListenerWithPassiveFlag;
function addEventBubbleListenerWithPassiveFlag(target, eventType, listener, passive) {
    target.addEventListener(eventType, listener, {
        passive: passive
    });
    return listener;
}
exports.addEventBubbleListenerWithPassiveFlag = addEventBubbleListenerWithPassiveFlag;
function removeEventListener(target, eventType, listener, capture) {
    target.removeEventListener(eventType, listener, capture);
}
exports.removeEventListener = removeEventListener;
