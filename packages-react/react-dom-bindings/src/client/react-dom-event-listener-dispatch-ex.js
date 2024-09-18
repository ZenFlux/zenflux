"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dispatchEventEx = void 0;
var react_fiber_reconciler_1 = require("@zenflux/react-reconciler/src/react-fiber-reconciler");
var EventSystemFlags_1 = require("@zenflux/react-dom-bindings/src/events/EventSystemFlags");
var react_dom_event_listener_find_1 = require("@zenflux/react-dom-bindings/src/events/react-dom-event-listener-find");
var react_dom_plugin_event_system_dispatch_1 = require("@zenflux/react-dom-bindings/src/events/react-dom-plugin-event-system-dispatch");
var ReactDOMEventReplaying_1 = require("@zenflux/react-dom-bindings/src/events/ReactDOMEventReplaying");
var react_dom_event_listener_dispatch_switch_1 = require("@zenflux/react-dom-bindings/src/client/react-dom-event-listener-dispatch-switch");
var ReactDOMComponentTree_1 = require("@zenflux/react-dom-bindings/src/client/ReactDOMComponentTree");
function dispatchEventEx(domEventName, eventSystemFlags, targetContainer, nativeEvent) {
    if (!(0, react_dom_event_listener_dispatch_switch_1.isEnabled)()) {
        return;
    }
    var blockedOn = (0, react_dom_event_listener_find_1.findInstanceBlockingEvent)(nativeEvent);
    if (blockedOn === null) {
        (0, react_dom_plugin_event_system_dispatch_1.dispatchEventForPluginEventSystem)(domEventName, eventSystemFlags, nativeEvent, react_dom_event_listener_find_1.return_targetInst, targetContainer);
        (0, ReactDOMEventReplaying_1.clearIfContinuousEvent)(domEventName, nativeEvent);
        return;
    }
    if ((0, ReactDOMEventReplaying_1.queueIfContinuousEvent)(blockedOn, domEventName, eventSystemFlags, targetContainer, nativeEvent)) {
        nativeEvent.stopPropagation();
        return;
    }
    // We need to clear only if we didn't queue because
    // queueing is accumulative.
    (0, ReactDOMEventReplaying_1.clearIfContinuousEvent)(domEventName, nativeEvent);
    if (eventSystemFlags & EventSystemFlags_1.IS_CAPTURE_PHASE && (0, ReactDOMEventReplaying_1.isDiscreteEventThatRequiresHydration)(domEventName)) {
        while (blockedOn !== null) {
            var fiber = (0, ReactDOMComponentTree_1.getInstanceFromNode)(blockedOn);
            if (fiber !== null) {
                (0, react_fiber_reconciler_1.attemptSynchronousHydration)(fiber);
            }
            var nextBlockedOn = (0, react_dom_event_listener_find_1.findInstanceBlockingEvent)(nativeEvent);
            if (nextBlockedOn === null) {
                (0, react_dom_plugin_event_system_dispatch_1.dispatchEventForPluginEventSystem)(domEventName, eventSystemFlags, nativeEvent, react_dom_event_listener_find_1.return_targetInst, targetContainer);
            }
            if (nextBlockedOn === blockedOn) {
                break;
            }
            blockedOn = nextBlockedOn;
        }
        if (blockedOn !== null) {
            nativeEvent.stopPropagation();
        }
        return;
    }
    // This is not replayable so we'll invoke it but without a target,
    // in case the event system needs to trace it.
    (0, react_dom_plugin_event_system_dispatch_1.dispatchEventForPluginEventSystem)(domEventName, eventSystemFlags, nativeEvent, null, targetContainer);
}
exports.dispatchEventEx = dispatchEventEx;
