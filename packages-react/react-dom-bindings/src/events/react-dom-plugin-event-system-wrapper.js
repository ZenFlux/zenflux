"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEventListenerWrapperWithPriority = void 0;
var react_event_priorities_1 = require("@zenflux/react-reconciler/src/react-event-priorities");
var react_dom_event_listener_dispatch_ex_1 = require("@zenflux/react-dom-bindings/src/client/react-dom-event-listener-dispatch-ex");
var react_dom_event_listener_dispatch_1 = require("@zenflux/react-dom-bindings/src/client/react-dom-event-listener-dispatch");
var react_dom_event_listener_priority_1 = require("@zenflux/react-dom-bindings/src/events/react-dom-event-listener-priority");
function createEventListenerWrapperWithPriority(targetContainer, domEventName, eventSystemFlags) {
    var eventPriority = (0, react_dom_event_listener_priority_1.getEventPriority)(domEventName);
    var listenerWrapper;
    switch (eventPriority) {
        case react_event_priorities_1.DiscreteEventPriority:
            listenerWrapper = react_dom_event_listener_dispatch_1.dispatchDiscreteEvent;
            break;
        case react_event_priorities_1.ContinuousEventPriority:
            listenerWrapper = react_dom_event_listener_dispatch_1.dispatchContinuousEvent;
            break;
        case react_event_priorities_1.DefaultEventPriority:
        default:
            listenerWrapper = react_dom_event_listener_dispatch_ex_1.dispatchEventEx;
            break;
    }
    return listenerWrapper.bind(null, domEventName, eventSystemFlags, targetContainer);
}
exports.createEventListenerWrapperWithPriority = createEventListenerWrapperWithPriority;
