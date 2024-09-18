"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addTrappedEventListener = void 0;
var react_feature_flags_1 = require("@zenflux/react-shared/src/react-feature-flags");
var checkPassiveEvents_1 = require("@zenflux/react-dom-bindings/src/events/checkPassiveEvents");
var EventListener_1 = require("@zenflux/react-dom-bindings/src/events/EventListener");
var react_dom_plugin_event_system_wrapper_1 = require("@zenflux/react-dom-bindings/src/events/react-dom-plugin-event-system-wrapper");
function addTrappedEventListener(targetContainer, domEventName, eventSystemFlags, isCapturePhaseListener, isDeferredListenerForLegacyFBSupport) {
    var listener = (0, react_dom_plugin_event_system_wrapper_1.createEventListenerWrapperWithPriority)(targetContainer, domEventName, eventSystemFlags);
    // If passive option is not supported, then the event will be
    // active and not passive.
    var isPassiveListener = undefined;
    if (checkPassiveEvents_1.passiveBrowserEventsSupported) {
        // Browsers introduced an intervention, making these events
        // passive by default on document. React doesn't bind them
        // to document anymore, but changing this now would undo
        // the performance wins from the change. So we emulate
        // the existing behavior manually on the roots now.
        // https://github.com/facebook/react/issues/19651
        if (domEventName === "touchstart" || domEventName === "touchmove" || domEventName === "wheel") {
            isPassiveListener = true;
        }
    }
    targetContainer = react_feature_flags_1.enableLegacyFBSupport && isDeferredListenerForLegacyFBSupport ? targetContainer.ownerDocument : targetContainer;
    var unsubscribeListener;
    // When legacyFBSupport is enabled, it's for when we
    // want to add a one time event listener to a container.
    // This should only be used with enableLegacyFBSupport
    // due to requirement to provide compatibility with
    // internal FB www event tooling. This works by removing
    // the event listener as soon as it is invoked. We could
    // also attempt to use the {once: true} param on
    // addEventListener, but that requires support and some
    // browsers do not support this today, and given this is
    // to support legacy code patterns, it's likely they'll
    // need support for such browsers.
    if (react_feature_flags_1.enableLegacyFBSupport && isDeferredListenerForLegacyFBSupport) {
        var originalListener_1 = listener;
        // $FlowFixMe[missing-this-annot]
        listener = function () {
            var p = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                p[_i] = arguments[_i];
            }
            (0, EventListener_1.removeEventListener)(targetContainer, domEventName, unsubscribeListener, isCapturePhaseListener);
            // @ts-ignore
            return originalListener_1.apply(this, p);
        };
    }
    // TODO: There are too many combinations here. Consolidate them.
    if (isCapturePhaseListener) {
        if (isPassiveListener !== undefined) {
            unsubscribeListener = (0, EventListener_1.addEventCaptureListenerWithPassiveFlag)(targetContainer, domEventName, listener, isPassiveListener);
        }
        else {
            unsubscribeListener = (0, EventListener_1.addEventCaptureListener)(targetContainer, domEventName, listener);
        }
    }
    else {
        if (isPassiveListener !== undefined) {
            unsubscribeListener = (0, EventListener_1.addEventBubbleListenerWithPassiveFlag)(targetContainer, domEventName, listener, isPassiveListener);
        }
        else {
            unsubscribeListener = (0, EventListener_1.addEventBubbleListener)(targetContainer, domEventName, listener);
        }
    }
}
exports.addTrappedEventListener = addTrappedEventListener;
