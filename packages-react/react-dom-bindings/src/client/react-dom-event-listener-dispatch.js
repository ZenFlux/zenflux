"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dispatchContinuousEvent = exports.dispatchDiscreteEvent = void 0;
var react_event_priorities_1 = require("@zenflux/react-reconciler/src/react-event-priorities");
var react_shared_internals_1 = require("@zenflux/react-shared/src/react-shared-internals");
var react_dom_event_listener_dispatch_ex_1 = require("@zenflux/react-dom-bindings/src/client/react-dom-event-listener-dispatch-ex");
var ReactCurrentBatchConfig = react_shared_internals_1.default.ReactCurrentBatchConfig;
function dispatchDiscreteEvent(domEventName, eventSystemFlags, container, nativeEvent) {
    var previousPriority = (0, react_event_priorities_1.getCurrentUpdatePriority)();
    var prevTransition = ReactCurrentBatchConfig.transition;
    ReactCurrentBatchConfig.transition = null;
    try {
        (0, react_event_priorities_1.setCurrentUpdatePriority)(react_event_priorities_1.DiscreteEventPriority);
        (0, react_dom_event_listener_dispatch_ex_1.dispatchEventEx)(domEventName, eventSystemFlags, container, nativeEvent);
    }
    finally {
        (0, react_event_priorities_1.setCurrentUpdatePriority)(previousPriority);
        ReactCurrentBatchConfig.transition = prevTransition;
    }
}
exports.dispatchDiscreteEvent = dispatchDiscreteEvent;
function dispatchContinuousEvent(domEventName, eventSystemFlags, container, nativeEvent) {
    var previousPriority = (0, react_event_priorities_1.getCurrentUpdatePriority)();
    var prevTransition = ReactCurrentBatchConfig.transition;
    ReactCurrentBatchConfig.transition = null;
    try {
        (0, react_event_priorities_1.setCurrentUpdatePriority)(react_event_priorities_1.ContinuousEventPriority);
        (0, react_dom_event_listener_dispatch_ex_1.dispatchEventEx)(domEventName, eventSystemFlags, container, nativeEvent);
    }
    finally {
        (0, react_event_priorities_1.setCurrentUpdatePriority)(previousPriority);
        ReactCurrentBatchConfig.transition = prevTransition;
    }
}
exports.dispatchContinuousEvent = dispatchContinuousEvent;
