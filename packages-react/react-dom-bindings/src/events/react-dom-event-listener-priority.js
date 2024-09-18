"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEventPriority = void 0;
var react_event_priorities_1 = require("@zenflux/react-reconciler/src/react-event-priorities");
var react_scheduler_1 = require("@zenflux/react-scheduler");
function getEventPriority(domEventName) {
    switch (domEventName) {
        // Used by SimpleEventPlugin:
        case "cancel":
        case "click":
        case "close":
        case "contextmenu":
        case "copy":
        case "cut":
        case "auxclick":
        case "dblclick":
        case "dragend":
        case "dragstart":
        case "drop":
        case "focusin":
        case "focusout":
        case "input":
        case "invalid":
        case "keydown":
        case "keypress":
        case "keyup":
        case "mousedown":
        case "mouseup":
        case "paste":
        case "pause":
        case "play":
        case "pointercancel":
        case "pointerdown":
        case "pointerup":
        case "ratechange":
        case "reset":
        case "resize":
        case "seeked":
        case "submit":
        case "touchcancel":
        case "touchend":
        case "touchstart":
        case "volumechange":
        // Used by polyfills: (fall through)
        case "change":
        case "selectionchange":
        case "textInput":
        case "compositionstart":
        case "compositionend":
        case "compositionupdate":
        // Only enableCreateEventHandleAPI: (fall through)
        case "beforeblur":
        case "afterblur":
        // Not used by React but could be by user code: (fall through)
        case "beforeinput":
        case "blur":
        case "fullscreenchange":
        case "focus":
        case "hashchange":
        case "popstate":
        case "select":
        case "selectstart":
            return react_event_priorities_1.DiscreteEventPriority;
        case "drag":
        case "dragenter":
        case "dragexit":
        case "dragleave":
        case "dragover":
        case "mousemove":
        case "mouseout":
        case "mouseover":
        case "pointermove":
        case "pointerout":
        case "pointerover":
        case "scroll":
        case "toggle":
        case "touchmove":
        case "wheel":
        // Not used by React but could be by user code: (fall through)
        case "mouseenter":
        case "mouseleave":
        case "pointerenter":
        case "pointerleave":
            return react_event_priorities_1.ContinuousEventPriority;
        case "message": {
            // We might be in the Scheduler callback.
            // Eventually this mechanism will be replaced by a check
            // of the current priority on the native scheduler.
            var schedulerPriority = (0, react_scheduler_1.unstable_getCurrentPriorityLevel)();
            switch (schedulerPriority) {
                case react_scheduler_1.unstable_ImmediatePriority:
                    return react_event_priorities_1.DiscreteEventPriority;
                case react_scheduler_1.unstable_UserBlockingPriority:
                    return react_event_priorities_1.ContinuousEventPriority;
                case react_scheduler_1.unstable_NormalPriority:
                case react_scheduler_1.unstable_LowPriority:
                    // TODO: Handle LowSchedulerPriority, somehow. Maybe the same lane as hydration.
                    return react_event_priorities_1.DefaultEventPriority;
                case react_scheduler_1.unstable_IdlePriority:
                    return react_event_priorities_1.IdleEventPriority;
                default:
                    return react_event_priorities_1.DefaultEventPriority;
            }
        }
        default:
            return react_event_priorities_1.DefaultEventPriority;
    }
}
exports.getEventPriority = getEventPriority;
