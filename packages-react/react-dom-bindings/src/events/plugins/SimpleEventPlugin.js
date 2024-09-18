"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractEvents = exports.registerEvents = void 0;
var react_feature_flags_1 = require("@zenflux/react-shared/src/react-feature-flags");
var react_dom_plugin_event_system_accumulate_1 = require("@zenflux/react-dom-bindings/src/events/react-dom-plugin-event-system-accumulate");
var EventSystemFlags_1 = require("@zenflux/react-dom-bindings/src/events/EventSystemFlags");
var SyntheticEvent_1 = require("@zenflux/react-dom-bindings/src/events/SyntheticEvent");
var DOMEventNames_1 = require("@zenflux/react-dom-bindings/src/events/DOMEventNames");
var DOMEventProperties_1 = require("@zenflux/react-dom-bindings/src/events/DOMEventProperties");
Object.defineProperty(exports, "registerEvents", { enumerable: true, get: function () { return DOMEventProperties_1.registerSimpleEvents; } });
var getEventCharCode_1 = require("@zenflux/react-dom-bindings/src/events/getEventCharCode");
function extractEvents(dispatchQueue, domEventName, targetInst, nativeEvent, nativeEventTarget, eventSystemFlags, targetContainer) {
    var reactName = DOMEventProperties_1.topLevelEventsToReactNames.get(domEventName);
    if (reactName === undefined) {
        return;
    }
    var SyntheticEventCtor = SyntheticEvent_1.SyntheticEvent;
    var reactEventType = domEventName;
    switch (domEventName) {
        case "keypress":
            // Firefox creates a keypress event for function keys too. This removes
            // the unwanted keypress events. Enter is however both printable and
            // non-printable. One would expect Tab to be as well (but it isn't).
            // TODO: Fixed in https://bugzilla.mozilla.org/show_bug.cgi?id=968056. Can
            // probably remove.
            if ((0, getEventCharCode_1.default)(nativeEvent) === 0) {
                return;
            }
        /* falls through */
        case "keydown":
        case "keyup":
            SyntheticEventCtor = SyntheticEvent_1.SyntheticKeyboardEvent;
            break;
        case "focusin":
            reactEventType = "focus";
            SyntheticEventCtor = SyntheticEvent_1.SyntheticFocusEvent;
            break;
        case "focusout":
            reactEventType = "blur";
            SyntheticEventCtor = SyntheticEvent_1.SyntheticFocusEvent;
            break;
        case "beforeblur":
        case "afterblur":
            SyntheticEventCtor = SyntheticEvent_1.SyntheticFocusEvent;
            break;
        case "click":
            // Firefox creates a click event on right mouse clicks. This removes the
            // unwanted click events.
            // TODO: Fixed in https://phabricator.services.mozilla.com/D26793. Can
            // probably remove.
            // @ts-ignore
            if (nativeEvent.button === 2) {
                return;
            }
        /* falls through */
        case "auxclick":
        case "dblclick":
        case "mousedown":
        case "mousemove":
        case "mouseup":
        // TODO: Disabled elements should not respond to mouse events
        /* falls through */
        case "mouseout":
        case "mouseover":
        case "contextmenu":
            SyntheticEventCtor = SyntheticEvent_1.SyntheticMouseEvent;
            break;
        case "drag":
        case "dragend":
        case "dragenter":
        case "dragexit":
        case "dragleave":
        case "dragover":
        case "dragstart":
        case "drop":
            SyntheticEventCtor = SyntheticEvent_1.SyntheticDragEvent;
            break;
        case "touchcancel":
        case "touchend":
        case "touchmove":
        case "touchstart":
            SyntheticEventCtor = SyntheticEvent_1.SyntheticTouchEvent;
            break;
        case DOMEventNames_1.ANIMATION_END:
        case DOMEventNames_1.ANIMATION_ITERATION:
        case DOMEventNames_1.ANIMATION_START:
            SyntheticEventCtor = SyntheticEvent_1.SyntheticAnimationEvent;
            break;
        case DOMEventNames_1.TRANSITION_END:
            SyntheticEventCtor = SyntheticEvent_1.SyntheticTransitionEvent;
            break;
        case "scroll":
        case "scrollend":
            SyntheticEventCtor = SyntheticEvent_1.SyntheticUIEvent;
            break;
        case "wheel":
            SyntheticEventCtor = SyntheticEvent_1.SyntheticWheelEvent;
            break;
        case "copy":
        case "cut":
        case "paste":
            SyntheticEventCtor = SyntheticEvent_1.SyntheticClipboardEvent;
            break;
        case "gotpointercapture":
        case "lostpointercapture":
        case "pointercancel":
        case "pointerdown":
        case "pointermove":
        case "pointerout":
        case "pointerover":
        case "pointerup":
            SyntheticEventCtor = SyntheticEvent_1.SyntheticPointerEvent;
            break;
        default:
            // Unknown event. This is used by createEventHandle.
            break;
    }
    var inCapturePhase = (eventSystemFlags & EventSystemFlags_1.IS_CAPTURE_PHASE) !== 0;
    if (react_feature_flags_1.enableCreateEventHandleAPI && eventSystemFlags & EventSystemFlags_1.IS_EVENT_HANDLE_NON_MANAGED_NODE) {
        var listeners = (0, react_dom_plugin_event_system_accumulate_1.accumulateEventHandleNonManagedNodeListeners)(// TODO: this cast may not make sense for events like
        // "focus" where React listens to e.g. "focusin".
        reactEventType, targetContainer, inCapturePhase);
        if (listeners.length > 0) {
            // Intentionally create event lazily.
            var event_1 = new SyntheticEventCtor(reactName, reactEventType, null, nativeEvent, nativeEventTarget);
            dispatchQueue.push({
                event: event_1,
                listeners: listeners
            });
        }
    }
    else {
        // Some events don't bubble in the browser.
        // In the past, React has always bubbled them, but this can be surprising.
        // We're going to try aligning closer to the browser behavior by not bubbling
        // them in React either. We'll start by not bubbling onScroll, and then expand.
        var accumulateTargetOnly = !inCapturePhase && ( // TODO: ideally, we'd eventually add all events from
        // nonDelegatedEvents list in DOMPluginEventSystem.
        // Then we can remove this special list.
        // This is a breaking change that can wait until React 18.
        domEventName === "scroll" || domEventName === "scrollend");
        var listeners = (0, react_dom_plugin_event_system_accumulate_1.accumulateSinglePhaseListeners)(targetInst, reactName, nativeEvent.type, inCapturePhase, accumulateTargetOnly, nativeEvent);
        if (listeners.length > 0) {
            // Intentionally create event lazily.
            var event_2 = new SyntheticEventCtor(reactName, reactEventType, null, nativeEvent, nativeEventTarget);
            dispatchQueue.push({
                event: event_2,
                listeners: listeners
            });
        }
    }
}
exports.extractEvents = extractEvents;
