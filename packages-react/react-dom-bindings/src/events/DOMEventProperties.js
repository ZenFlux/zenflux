"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSimpleEvents = exports.topLevelEventsToReactNames = void 0;
var react_feature_flags_1 = require("@zenflux/react-shared/src/react-feature-flags");
var DOMEventNames_1 = require("@zenflux/react-dom-bindings/src/events/DOMEventNames");
var EventRegistry_1 = require("@zenflux/react-dom-bindings/src/events/EventRegistry");
exports.topLevelEventsToReactNames = new Map();
// NOTE: Capitalization is important in this list!
//
// E.g. it needs "pointerDown", not "pointerdown".
// This is because we derive both React name ("onPointerDown")
// and DOM name ("pointerdown") from the same list.
//
// Exceptions that don't match this convention are listed separately.
//
// prettier-ignore
var simpleEventPluginEvents = ["abort", "auxClick", "cancel", "canPlay", "canPlayThrough", "click", "close", "contextMenu", "copy", "cut", "drag", "dragEnd", "dragEnter", "dragExit", "dragLeave", "dragOver", "dragStart", "drop", "durationChange", "emptied", "encrypted", "ended", "error", "gotPointerCapture", "input", "invalid", "keyDown", "keyPress", "keyUp", "load", "loadedData", "loadedMetadata", "loadStart", "lostPointerCapture", "mouseDown", "mouseMove", "mouseOut", "mouseOver", "mouseUp", "paste", "pause", "play", "playing", "pointerCancel", "pointerDown", "pointerMove", "pointerOut", "pointerOver", "pointerUp", "progress", "rateChange", "reset", "resize", "seeked", "seeking", "stalled", "submit", "suspend", "timeUpdate", "touchCancel", "touchEnd", "touchStart", "volumeChange", "scroll", "scrollEnd", "toggle", "touchMove", "waiting", "wheel"];
if (react_feature_flags_1.enableCreateEventHandleAPI) {
    // Special case: these two events don't have on* React handler
    // and are only accessible via the createEventHandle API.
    exports.topLevelEventsToReactNames.set("beforeblur", null);
    exports.topLevelEventsToReactNames.set("afterblur", null);
}
function registerSimpleEvent(domEventName, reactName) {
    exports.topLevelEventsToReactNames.set(domEventName, reactName);
    (0, EventRegistry_1.registerTwoPhaseEvent)(reactName, [domEventName]);
}
function registerSimpleEvents() {
    for (var i = 0; i < simpleEventPluginEvents.length; i++) {
        var eventName = simpleEventPluginEvents[i];
        var domEventName = eventName.toLowerCase();
        var capitalizedEvent = eventName[0].toUpperCase() + eventName.slice(1);
        registerSimpleEvent(domEventName, "on" + capitalizedEvent);
    }
    // Special cases where event names don't match.
    registerSimpleEvent(DOMEventNames_1.ANIMATION_END, "onAnimationEnd");
    registerSimpleEvent(DOMEventNames_1.ANIMATION_ITERATION, "onAnimationIteration");
    registerSimpleEvent(DOMEventNames_1.ANIMATION_START, "onAnimationStart");
    registerSimpleEvent("dblclick", "onDoubleClick");
    registerSimpleEvent("focusin", "onFocus");
    registerSimpleEvent("focusout", "onBlur");
    registerSimpleEvent(DOMEventNames_1.TRANSITION_END, "onTransitionEnd");
}
exports.registerSimpleEvents = registerSimpleEvents;
