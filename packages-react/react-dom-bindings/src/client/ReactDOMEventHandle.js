"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEventHandle = void 0;
var react_feature_flags_1 = require("@zenflux/react-shared/src/react-feature-flags");
var EventRegistry_1 = require("../events/EventRegistry");
var DOMPluginEventSystem_1 = require("../events/DOMPluginEventSystem");
var ReactDOMComponentTree_1 = require("@zenflux/react-dom-bindings/src/client/ReactDOMComponentTree");
var HTMLNodeType_1 = require("@zenflux/react-dom-bindings/src/client/HTMLNodeType");
function isValidEventTarget(target) {
    return typeof target.addEventListener === "function";
}
function isReactScope(target) {
    return typeof target.getChildContextValues === "function";
}
function createEventHandleListener(type, isCapturePhaseListener, callback) {
    return {
        callback: callback,
        capture: isCapturePhaseListener,
        type: type
    };
}
function registerReactDOMEvent(target, domEventName, isCapturePhaseListener) {
    if (target.nodeType === HTMLNodeType_1.ELEMENT_NODE) { // Do nothing. We already attached all root listeners.
    }
    else if (react_feature_flags_1.enableScopeAPI && isReactScope(target)) { // Do nothing. We already attached all root listeners.
    }
    else if (isValidEventTarget(target)) {
        var eventTarget = target;
        // These are valid event targets, but they are also
        // non-managed React nodes.
        (0, DOMPluginEventSystem_1.listenToNativeEventForNonManagedEventTarget)(domEventName, isCapturePhaseListener, eventTarget);
    }
    else {
        throw new Error("ReactDOM.createEventHandle: setter called on an invalid " + "target. Provide a valid EventTarget or an element managed by React.");
    }
}
function createEventHandle(type, options) {
    if (react_feature_flags_1.enableCreateEventHandleAPI) {
        var domEventName_1 = type;
        // We cannot support arbitrary native events with eager root listeners
        // because the eager strategy relies on knowing the whole list ahead of time.
        // If we wanted to support this, we'd have to add code to keep track
        // (or search) for all portal and root containers, and lazily add listeners
        // to them whenever we see a previously unknown event. This seems like a lot
        // of complexity for something we don't even have a particular use case for.
        // Unfortunately, the downside of this invariant is that *removing* a native
        // event from the list of known events has now become a breaking change for
        // any code relying on the createEventHandle API.
        if (!EventRegistry_1.allNativeEvents.has(domEventName_1)) {
            throw new Error("Cannot call unstable_createEventHandle with \"".concat(domEventName_1, "\", as it is not an event known to React."));
        }
        var isCapturePhaseListener_1 = false;
        if (options != null) {
            var optionsCapture = options.capture;
            if (typeof optionsCapture === "boolean") {
                isCapturePhaseListener_1 = optionsCapture;
            }
        }
        var eventHandle_1 = function (target, callback) {
            if (typeof callback !== "function") {
                throw new Error("ReactDOM.createEventHandle: setter called with an invalid " + "callback. The callback must be a function.");
            }
            if (!(0, ReactDOMComponentTree_1.doesTargetHaveEventHandle)(target, eventHandle_1)) {
                (0, ReactDOMComponentTree_1.addEventHandleToTarget)(target, eventHandle_1);
                registerReactDOMEvent(target, domEventName_1, isCapturePhaseListener_1);
            }
            var listener = createEventHandleListener(domEventName_1, isCapturePhaseListener_1, callback);
            var targetListeners = (0, ReactDOMComponentTree_1.getEventHandlerListeners)(target);
            if (targetListeners === null) {
                targetListeners = new Set();
                (0, ReactDOMComponentTree_1.setEventHandlerListeners)(target, targetListeners);
            }
            targetListeners.add(listener);
            return function () {
                targetListeners.delete(listener);
            };
        };
        return eventHandle_1;
    }
    return null;
}
exports.createEventHandle = createEventHandle;
