"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeEventListener = exports.addEventBubbleListenerWithPassiveFlag = exports.addEventCaptureListenerWithPassiveFlag = exports.addEventCaptureListener = exports.addEventBubbleListener = void 0;
var EventListenerWWW = require('EventListener');
require();
EventListenerType;
from;
"../EventListener";
require();
EventListenerShimType;
from;
"./EventListener-www";
function addEventBubbleListener(target, eventType, listener) {
    return EventListenerWWW.listen(target, eventType, listener);
}
exports.addEventBubbleListener = addEventBubbleListener;
function addEventCaptureListener(target, eventType, listener) {
    return EventListenerWWW.capture(target, eventType, listener);
}
exports.addEventCaptureListener = addEventCaptureListener;
function addEventCaptureListenerWithPassiveFlag(target, eventType, listener, passive) {
    return EventListenerWWW.captureWithPassiveFlag(target, eventType, listener, passive);
}
exports.addEventCaptureListenerWithPassiveFlag = addEventCaptureListenerWithPassiveFlag;
function addEventBubbleListenerWithPassiveFlag(target, eventType, listener, passive) {
    return EventListenerWWW.bubbleWithPassiveFlag(target, eventType, listener, passive);
}
exports.addEventBubbleListenerWithPassiveFlag = addEventBubbleListenerWithPassiveFlag;
function removeEventListener(target, eventType, listener, capture) {
    listener.remove();
}
exports.removeEventListener = removeEventListener;
// Flow magic to verify the exports of this file match the original version.
null;
