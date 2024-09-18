"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getListenerSetKey = exports.listenToAllSupportedEvents = exports.listenToNativeEventForNonManagedEventTarget = exports.listenToNativeEvent = exports.listenToNonDelegatedEvent = exports.nonDelegatedEvents = exports.mediaEventTypes = void 0;
var EventRegistry_1 = require("@zenflux/react-dom-bindings/src/events/EventRegistry");
var ReactDOMComponentTree_1 = require("@zenflux/react-dom-bindings/src/client/ReactDOMComponentTree");
var HTMLNodeType_1 = require("@zenflux/react-dom-bindings/src/client/HTMLNodeType");
var EventSystemFlags_1 = require("@zenflux/react-dom-bindings/src/events/EventSystemFlags");
var BeforeInputEventPlugin = require("@zenflux/react-dom-bindings/src/events/plugins/BeforeInputEventPlugin");
var ChangeEventPlugin = require("@zenflux/react-dom-bindings/src/events/plugins/ChangeEventPlugin");
var EnterLeaveEventPlugin = require("@zenflux/react-dom-bindings/src/events/plugins/EnterLeaveEventPlugin");
var SelectEventPlugin = require("@zenflux/react-dom-bindings/src/events/plugins/SelectEventPlugin");
var SimpleEventPlugin = require("@zenflux/react-dom-bindings/src/events/plugins/SimpleEventPlugin");
var react_dom_plugin_event_system_trapped_1 = require("@zenflux/react-dom-bindings/src/events/react-dom-plugin-event-system-trapped");
// TODO: remove top-level side effect.
SimpleEventPlugin.registerEvents();
EnterLeaveEventPlugin.registerEvents();
ChangeEventPlugin.registerEvents();
SelectEventPlugin.registerEvents();
BeforeInputEventPlugin.registerEvents();
// List of events that need to be individually attached to media elements.
exports.mediaEventTypes = ["abort", "canplay", "canplaythrough", "durationchange", "emptied", "encrypted", "ended", "error", "loadeddata", "loadedmetadata", "loadstart", "pause", "play", "playing", "progress", "ratechange", "resize", "seeked", "seeking", "stalled", "suspend", "timeupdate", "volumechange", "waiting"];
// We should not delegate these events to the container, but rather
// set them on the actual target element itself. This is primarily
// because these events do not consistently bubble in the DOM.
exports.nonDelegatedEvents = new Set(__spreadArray(["cancel", "close", "invalid", "load", "scroll", "scrollend", "toggle"], exports.mediaEventTypes, true));
function listenToNonDelegatedEvent(domEventName, targetElement) {
    if (__DEV__) {
        if (!exports.nonDelegatedEvents.has(domEventName)) {
            console.error("Did not expect a listenToNonDelegatedEvent() call for \"%s\". " + "This is a bug in React. Please file an issue.", domEventName);
        }
    }
    var isCapturePhaseListener = false;
    var listenerSet = (0, ReactDOMComponentTree_1.getEventListenerSet)(targetElement);
    var listenerSetKey = getListenerSetKey(domEventName, isCapturePhaseListener);
    if (!listenerSet.has(listenerSetKey)) {
        (0, react_dom_plugin_event_system_trapped_1.addTrappedEventListener)(targetElement, domEventName, EventSystemFlags_1.IS_NON_DELEGATED, isCapturePhaseListener);
        listenerSet.add(listenerSetKey);
    }
}
exports.listenToNonDelegatedEvent = listenToNonDelegatedEvent;
function listenToNativeEvent(domEventName, isCapturePhaseListener, target) {
    if (__DEV__) {
        if (exports.nonDelegatedEvents.has(domEventName) && !isCapturePhaseListener) {
            console.error("Did not expect a listenToNativeEvent() call for \"%s\" in the bubble phase. " + "This is a bug in React. Please file an issue.", domEventName);
        }
    }
    var eventSystemFlags = 0;
    if (isCapturePhaseListener) {
        eventSystemFlags |= EventSystemFlags_1.IS_CAPTURE_PHASE;
    }
    (0, react_dom_plugin_event_system_trapped_1.addTrappedEventListener)(target, domEventName, eventSystemFlags, isCapturePhaseListener);
}
exports.listenToNativeEvent = listenToNativeEvent;
// This is only used by createEventHandle when the
// target is not a DOM element. E.g. window.
function listenToNativeEventForNonManagedEventTarget(domEventName, isCapturePhaseListener, target) {
    var eventSystemFlags = EventSystemFlags_1.IS_EVENT_HANDLE_NON_MANAGED_NODE;
    var listenerSet = (0, ReactDOMComponentTree_1.getEventListenerSet)(target);
    var listenerSetKey = getListenerSetKey(domEventName, isCapturePhaseListener);
    if (!listenerSet.has(listenerSetKey)) {
        if (isCapturePhaseListener) {
            eventSystemFlags |= EventSystemFlags_1.IS_CAPTURE_PHASE;
        }
        (0, react_dom_plugin_event_system_trapped_1.addTrappedEventListener)(target, domEventName, eventSystemFlags, isCapturePhaseListener);
        listenerSet.add(listenerSetKey);
    }
}
exports.listenToNativeEventForNonManagedEventTarget = listenToNativeEventForNonManagedEventTarget;
var listeningMarker = "_reactListening" + Math.random().toString(36).slice(2);
function listenToAllSupportedEvents(rootContainerElement) {
    if (!rootContainerElement[listeningMarker]) {
        rootContainerElement[listeningMarker] = true;
        EventRegistry_1.allNativeEvents.forEach(function (domEventName) {
            // We handle selectionchange separately because it
            // doesn't bubble and needs to be on the document.
            if (domEventName !== "selectionchange") {
                if (!exports.nonDelegatedEvents.has(domEventName)) {
                    listenToNativeEvent(domEventName, false, rootContainerElement);
                }
                listenToNativeEvent(domEventName, true, rootContainerElement);
            }
        });
        var ownerDocument = rootContainerElement.nodeType === HTMLNodeType_1.DOCUMENT_NODE ? rootContainerElement : rootContainerElement.ownerDocument;
        if (ownerDocument !== null) {
            // The selectionchange event also needs deduplication
            // but it is attached to the document.
            if (!ownerDocument[listeningMarker]) {
                ownerDocument[listeningMarker] = true;
                listenToNativeEvent("selectionchange", false, ownerDocument);
            }
        }
    }
}
exports.listenToAllSupportedEvents = listenToAllSupportedEvents;
function getListenerSetKey(domEventName, capture) {
    return "".concat(domEventName, "__").concat(capture ? "capture" : "bubble");
}
exports.getListenerSetKey = getListenerSetKey;
